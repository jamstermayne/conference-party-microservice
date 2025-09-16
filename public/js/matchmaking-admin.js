/**
 * Matchmaking Admin Panel JavaScript
 * Handles UI interactions and API communication
 */

class MatchmakingAdmin {
    constructor() {
        this.baseUrl = '/api/matchmaking';
        this.currentTab = 'upload';
        this.currentWeightsProfile = null;
        this.companies = [];
        this.weightsProfiles = [];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTabs();
        await this.loadInitialData();
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Upload buttons
        document.getElementById('confirm-upload').addEventListener('click', this.confirmUpload.bind(this));
        document.getElementById('cancel-upload').addEventListener('click', this.cancelUpload.bind(this));

        // Company management
        document.getElementById('company-search').addEventListener('input', this.filterCompanies.bind(this));
        document.getElementById('company-type-filter').addEventListener('change', this.filterCompanies.bind(this));
        document.getElementById('company-country-filter').addEventListener('change', this.filterCompanies.bind(this));
        document.getElementById('add-company-btn').addEventListener('click', this.addCompany.bind(this));

        // Weights management
        document.getElementById('weights-profile-select').addEventListener('change', this.loadWeightsProfile.bind(this));
        document.getElementById('new-profile-btn').addEventListener('click', this.createNewProfile.bind(this));
        document.getElementById('duplicate-profile-btn').addEventListener('click', this.duplicateProfile.bind(this));
        document.getElementById('save-weights-btn').addEventListener('click', this.saveWeightsProfile.bind(this));
        document.getElementById('reset-weights-btn').addEventListener('click', this.resetWeights.bind(this));
        document.getElementById('test-weights-btn').addEventListener('click', this.testWeights.bind(this));

        // Match explorer
        document.getElementById('find-matches-btn').addEventListener('click', this.findMatches.bind(this));
        document.getElementById('export-matches-btn').addEventListener('click', this.exportMatches.bind(this));

        // Taxonomy
        document.getElementById('generate-viz-btn').addEventListener('click', this.generateVisualization.bind(this));
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const panels = document.querySelectorAll('.content-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active panel
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(`${tabName}-panel`).classList.add('active');

                this.currentTab = tabName;

                // Load tab-specific data
                this.loadTabData(tabName);
            });
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadCompanies(),
            this.loadWeightsProfiles(),
            this.loadUploadHistory(),
            this.loadAnalytics()
        ]);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'companies':
                await this.loadCompanies();
                break;
            case 'weights':
                await this.loadWeightsProfiles();
                break;
            case 'matches':
                await this.loadMatchData();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    // ============= FILE UPLOAD =============

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        // Validate file
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(file.type) && !file.name.match(/\\.(csv|xlsx?$)/i)) {
            this.showMessage('error', 'Invalid file type. Please upload CSV or Excel files only.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            this.showMessage('error', 'File too large. Maximum size is 50MB.');
            return;
        }

        // Show progress
        this.showUploadProgress(true);

        try {
            // Parse file
            const data = await this.parseFile(file);

            // Show preview
            this.showUploadPreview(file.name, data);

        } catch (error) {
            console.error('File processing error:', error);
            this.showMessage('error', `Failed to process file: ${error.message}`);
            this.showUploadProgress(false);
        }
    }

    async parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;

                    if (file.name.endsWith('.csv')) {
                        const data = this.parseCSV(content);
                        resolve(data);
                    } else {
                        // For Excel files, we'd need a library like SheetJS
                        // For now, show error message
                        reject(new Error('Excel file parsing not implemented yet. Please use CSV files.'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCSV(content) {
        const lines = content.split('\\n');
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length !== headers.length) continue;

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }

        return data;
    }

    showUploadPreview(filename, data) {
        this.showUploadProgress(false);

        const previewDiv = document.getElementById('upload-preview');
        const contentDiv = document.getElementById('preview-content');

        // Show basic stats
        contentDiv.innerHTML = `
            <div class="card">
                <div class="card-title">File: ${filename}</div>
                <div class="card-content">
                    <p><strong>Rows:</strong> ${data.length}</p>
                    <p><strong>Columns:</strong> ${Object.keys(data[0] || {}).length}</p>
                    <p><strong>Sample Data:</strong></p>
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 3).map(row => `
                                <tr>
                                    ${Object.values(row).map(v => `<td>${v || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.currentUploadData = { filename, data };
        previewDiv.classList.remove('hidden');
    }

    async confirmUpload() {
        if (!this.currentUploadData) return;

        this.showUploadProgress(true, 'Uploading and processing data...');

        try {
            const response = await fetch(`${this.baseUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    filename: this.currentUploadData.filename,
                    data: this.currentUploadData.data,
                    validateOnly: false
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('success', `Upload completed successfully! Processed ${result.data.ingestLog.successCount} companies.`);
                await this.loadUploadHistory();
                await this.loadCompanies();
                this.cancelUpload();
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('error', `Upload failed: ${error.message}`);
        } finally {
            this.showUploadProgress(false);
        }
    }

    cancelUpload() {
        document.getElementById('upload-preview').classList.add('hidden');
        document.getElementById('file-input').value = '';
        this.currentUploadData = null;
    }

    showUploadProgress(show, text = 'Processing...') {
        const progressDiv = document.getElementById('upload-progress');
        const progressText = document.getElementById('progress-text');

        if (show) {
            progressText.textContent = text;
            progressDiv.classList.remove('hidden');
        } else {
            progressDiv.classList.add('hidden');
        }
    }

    async loadUploadHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/uploads`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.renderUploadHistory(result.data.items);
            }
        } catch (error) {
            console.error('Error loading upload history:', error);
        }
    }

    renderUploadHistory(uploads) {
        const tbody = document.getElementById('uploads-tbody');

        tbody.innerHTML = uploads.map(upload => `
            <tr>
                <td>${upload.filename}</td>
                <td>${new Date(upload.uploadedAt).toLocaleDateString()}</td>
                <td>${upload.rowCount}</td>
                <td><span class="status-badge status-${upload.status}">${upload.status}</span></td>
                <td>${upload.successCount}/${upload.processedRows} (${Math.round((upload.successCount / upload.processedRows) * 100)}%)</td>
            </tr>
        `).join('');
    }

    // ============= COMPANIES MANAGEMENT =============

    async loadCompanies() {
        try {
            const response = await fetch(`${this.baseUrl}/companies?pageSize=100`);
            const result = await response.json();

            if (result.success) {
                this.companies = result.data.items;
                this.renderCompanies();
                this.populateCompanyFilters();
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    }

    renderCompanies(companies = this.companies) {
        const tbody = document.getElementById('companies-tbody');

        tbody.innerHTML = companies.map(company => `
            <tr>
                <td>${company.name}</td>
                <td>${company.type || 'N/A'}</td>
                <td>${company.country || 'N/A'}</td>
                <td>${(company.industry || []).slice(0, 2).join(', ')}</td>
                <td>${company.size || 'N/A'}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="progress-bar" style="width: 60px; height: 6px;">
                            <div class="progress-fill" style="width: ${company.profileCompleteness || 0}%"></div>
                        </div>
                        <span style="font-size: 12px; color: #86868b;">${company.profileCompleteness || 0}%</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-secondary" onclick="admin.editCompany('${company.id}')" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                    <button class="btn btn-secondary" onclick="admin.findCompanyMatches('${company.id}')" style="padding: 6px 12px; font-size: 12px;">Matches</button>
                </td>
            </tr>
        `).join('');
    }

    populateCompanyFilters() {
        const countries = [...new Set(this.companies.map(c => c.country).filter(Boolean))].sort();
        const countrySelect = document.getElementById('company-country-filter');

        countrySelect.innerHTML = '<option value="">All Countries</option>' +
            countries.map(country => `<option value="${country}">${country}</option>`).join('');
    }

    filterCompanies() {
        const search = document.getElementById('company-search').value.toLowerCase();
        const typeFilter = document.getElementById('company-type-filter').value;
        const countryFilter = document.getElementById('company-country-filter').value;

        const filtered = this.companies.filter(company => {
            const matchesSearch = !search ||
                company.name.toLowerCase().includes(search) ||
                (company.description && company.description.toLowerCase().includes(search));

            const matchesType = !typeFilter || company.type === typeFilter;
            const matchesCountry = !countryFilter || company.country === countryFilter;

            return matchesSearch && matchesType && matchesCountry;
        });

        this.renderCompanies(filtered);
    }

    editCompany(companyId) {
        // Open company edit modal (would need to implement)
        console.log('Edit company:', companyId);
        this.showMessage('info', 'Company editing interface coming soon!');
    }

    findCompanyMatches(companyId) {
        // Switch to matches tab and populate with this company
        document.querySelector('[data-tab="matches"]').click();
        document.getElementById('match-company-select').value = companyId;
        this.findMatches();
    }

    addCompany() {
        this.showMessage('info', 'Add company interface coming soon!');
    }

    // ============= WEIGHTS MANAGEMENT =============

    async loadWeightsProfiles() {
        try {
            const response = await fetch(`${this.baseUrl}/weights`);
            const result = await response.json();

            if (result.success) {
                this.weightsProfiles = result.data;
                this.populateWeightsSelects();
            }
        } catch (error) {
            console.error('Error loading weights profiles:', error);
        }
    }

    populateWeightsSelects() {
        const selects = [
            document.getElementById('weights-profile-select'),
            document.getElementById('match-weights-select')
        ];

        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = this.weightsProfiles.map(profile =>
                `<option value="${profile.id}">${profile.name} (${profile.persona})</option>`
            ).join('');

            if (currentValue && this.weightsProfiles.find(p => p.id === currentValue)) {
                select.value = currentValue;
            } else if (this.weightsProfiles.length > 0) {
                select.value = this.weightsProfiles[0].id;
            }
        });

        // Also populate company select for matches
        this.populateCompanySelect();
    }

    populateCompanySelect() {
        const select = document.getElementById('match-company-select');
        select.innerHTML = '<option value="">Select company...</option>' +
            this.companies.map(company =>
                `<option value="${company.id}">${company.name}</option>`
            ).join('');
    }

    loadWeightsProfile() {
        const profileId = document.getElementById('weights-profile-select').value;
        const profile = this.weightsProfiles.find(p => p.id === profileId);

        if (profile) {
            this.currentWeightsProfile = profile;
            this.renderWeightsEditor(profile);
            document.getElementById('weights-editor').classList.remove('hidden');
        } else {
            document.getElementById('weights-editor').classList.add('hidden');
        }
    }

    renderWeightsEditor(profile) {
        document.getElementById('profile-name').value = profile.name;
        document.getElementById('profile-description').value = profile.description;
        document.getElementById('profile-persona').value = profile.persona;

        const weightsGrid = document.getElementById('weights-grid');

        const weightGroups = {
            'Date Signals': {
                foundingDateProximity: 'Founding Date Proximity',
                fundingDateRelevance: 'Funding Date Relevance'
            },
            'List Similarity': {
                industryAlignment: 'Industry Alignment',
                platformOverlap: 'Platform Overlap',
                technologyMatch: 'Technology Match',
                marketSynergy: 'Market Synergy',
                capabilityNeedMatch: 'Capability-Need Match'
            },
            'Numeric Signals': {
                companySizeCompatibility: 'Company Size Compatibility',
                fundingStageAlignment: 'Funding Stage Alignment',
                revenueCompatibility: 'Revenue Compatibility',
                employeeCountSynergy: 'Employee Count Synergy'
            },
            'String Similarity': {
                companyNameSimilarity: 'Company Name Similarity',
                locationProximity: 'Location Proximity'
            },
            'Text Analysis': {
                pitchAlignment: 'Pitch Alignment',
                lookingForMatch: 'Looking For Match',
                descriptionSimilarity: 'Description Similarity'
            },
            'Context Boosts': {
                platformContextBoost: 'Platform Context Boost',
                marketContextBoost: 'Market Context Boost',
                stageContextBoost: 'Stage Context Boost'
            }
        };

        weightsGrid.innerHTML = Object.entries(weightGroups).map(([groupName, weights]) => `
            <div class="weight-group">
                <h3>${groupName}</h3>
                ${Object.entries(weights).map(([key, label]) => `
                    <div class="weight-item">
                        <span class="weight-label">${label}</span>
                        <input
                            type="number"
                            class="weight-input"
                            id="weight-${key}"
                            value="${profile.weights[key] || 0}"
                            min="0"
                            max="100"
                            step="1"
                        >
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    createNewProfile() {
        this.currentWeightsProfile = null;
        const defaultProfile = {
            name: 'New Profile',
            description: 'Custom weights profile',
            persona: 'general',
            weights: this.getDefaultWeights()
        };

        this.renderWeightsEditor(defaultProfile);
        document.getElementById('weights-editor').classList.remove('hidden');
    }

    getDefaultWeights() {
        return {
            foundingDateProximity: 30,
            fundingDateRelevance: 40,
            industryAlignment: 80,
            platformOverlap: 70,
            technologyMatch: 60,
            marketSynergy: 75,
            capabilityNeedMatch: 85,
            companySizeCompatibility: 65,
            fundingStageAlignment: 70,
            revenueCompatibility: 55,
            employeeCountSynergy: 50,
            companyNameSimilarity: 10,
            locationProximity: 35,
            pitchAlignment: 60,
            lookingForMatch: 70,
            descriptionSimilarity: 45,
            platformContextBoost: 20,
            marketContextBoost: 25,
            stageContextBoost: 20
        };
    }

    async saveWeightsProfile() {
        const profileData = {
            name: document.getElementById('profile-name').value,
            description: document.getElementById('profile-description').value,
            persona: document.getElementById('profile-persona').value,
            weights: {}
        };

        // Collect all weight values
        const weightInputs = document.querySelectorAll('.weight-input');
        weightInputs.forEach(input => {
            const key = input.id.replace('weight-', '');
            profileData.weights[key] = parseInt(input.value) || 0;
        });

        try {
            const url = this.currentWeightsProfile
                ? `${this.baseUrl}/weights/${this.currentWeightsProfile.id}`
                : `${this.baseUrl}/weights`;

            const method = this.currentWeightsProfile ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('success', 'Weights profile saved successfully!');
                await this.loadWeightsProfiles();
                this.currentWeightsProfile = result.data;
            } else {
                throw new Error(result.error || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving weights profile:', error);
            this.showMessage('error', `Failed to save profile: ${error.message}`);
        }
    }

    resetWeights() {
        if (confirm('Reset all weights to default values?')) {
            const defaultWeights = this.getDefaultWeights();
            Object.entries(defaultWeights).forEach(([key, value]) => {
                const input = document.getElementById(`weight-${key}`);
                if (input) input.value = value;
            });
        }
    }

    testWeights() {
        this.showMessage('info', 'Weights testing interface coming soon!');
    }

    duplicateProfile() {
        if (this.currentWeightsProfile) {
            const newName = prompt('Enter name for duplicate profile:', `${this.currentWeightsProfile.name} (Copy)`);
            if (newName) {
                // Would implement duplicate API call
                this.showMessage('info', 'Profile duplication coming soon!');
            }
        }
    }

    // ============= MATCH EXPLORER =============

    async loadMatchData() {
        // Ensure companies and weights are loaded
        if (this.companies.length === 0) await this.loadCompanies();
        if (this.weightsProfiles.length === 0) await this.loadWeightsProfiles();

        this.populateCompanySelect();
        this.populateWeightsSelects();
    }

    async findMatches() {
        const companyId = document.getElementById('match-company-select').value;
        const weightsProfileId = document.getElementById('match-weights-select').value;
        const minScore = parseInt(document.getElementById('match-min-score').value) || 40;

        if (!companyId) {
            this.showMessage('error', 'Please select a company first.');
            return;
        }

        const findBtn = document.getElementById('find-matches-btn');
        findBtn.disabled = true;
        findBtn.innerHTML = '<span class="loading-spinner"></span> Finding matches...';

        try {
            const response = await fetch(`${this.baseUrl}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyId,
                    weightsProfileId,
                    minScore,
                    includeExplanations: true
                })
            });

            const result = await response.json();

            if (result.success) {
                this.renderMatches(result.data);
                document.getElementById('matches-results').classList.remove('hidden');
            } else {
                throw new Error(result.error || 'Failed to find matches');
            }
        } catch (error) {
            console.error('Error finding matches:', error);
            this.showMessage('error', `Failed to find matches: ${error.message}`);
        } finally {
            findBtn.disabled = false;
            findBtn.innerHTML = 'Find Matches';
        }
    }

    renderMatches(matchData) {
        const tbody = document.getElementById('matches-tbody');

        tbody.innerHTML = matchData.matches.map(match => {
            const companyA = this.companies.find(c => c.id === match.companyA);
            const companyB = this.companies.find(c => c.id === match.companyB);

            const topSignals = match.signals
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 3)
                .map(s => s.field.replace(/([A-Z])/g, ' $1').trim())
                .join(', ');

            return `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${companyB?.name || 'Unknown'}</div>
                        <div style="font-size: 12px; color: #86868b;">${companyB?.type || 'N/A'}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #007aff;">${match.overallScore}</div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${match.confidence}%</div>
                    </td>
                    <td>
                        <span style="text-transform: capitalize; font-size: 12px;">
                            ${match.suggestedMeetingType.replace('_', ' ')}
                        </span>
                    </td>
                    <td style="font-size: 12px; color: #424245;">
                        ${topSignals}
                    </td>
                    <td>
                        <button class="btn btn-secondary" onclick="admin.viewMatchDetails('${match.id}')" style="padding: 6px 12px; font-size: 12px;">Details</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    viewMatchDetails(matchId) {
        this.showMessage('info', 'Match details view coming soon!');
    }

    exportMatches() {
        this.showMessage('info', 'Match export functionality coming soon!');
    }

    // ============= TAXONOMY =============

    async generateVisualization() {
        const dimension = document.getElementById('taxonomy-dimension').value;
        const visualization = document.getElementById('taxonomy-visualization').value;
        const filter = document.getElementById('taxonomy-filter').value;

        const generateBtn = document.getElementById('generate-viz-btn');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="loading-spinner"></span> Generating...';

        try {
            const response = await fetch(`${this.baseUrl}/taxonomy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dimension,
                    visualization,
                    filters: filter ? { companyTypes: [filter] } : undefined
                })
            });

            const result = await response.json();

            if (result.success) {
                this.renderTaxonomyResults(result.data);
                document.getElementById('taxonomy-results').classList.remove('hidden');
            } else {
                throw new Error(result.error || 'Failed to generate visualization');
            }
        } catch (error) {
            console.error('Error generating visualization:', error);
            this.showMessage('error', `Failed to generate visualization: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = 'Generate Visualization';
        }
    }

    renderTaxonomyResults(taxonomyData) {
        // Show metadata
        const metadataDiv = document.getElementById('viz-metadata');
        metadataDiv.innerHTML = `
            <div class="card-title">${taxonomyData.dimension} ${taxonomyData.visualization}</div>
            <div class="card-content">
                <p><strong>Companies:</strong> ${taxonomyData.metadata.totalCompanies}</p>
                <p><strong>Unique Values:</strong> ${taxonomyData.metadata.uniqueValues}</p>
                <p><strong>Data Coverage:</strong> ${Math.round(taxonomyData.metadata.coverage)}%</p>
                <p><strong>Generated:</strong> ${new Date(taxonomyData.metadata.generatedAt).toLocaleString()}</p>
            </div>
        `;

        // Show visualization placeholder
        const vizContainer = document.getElementById('viz-container');

        if (taxonomyData.visualization === 'distribution') {
            this.renderDistributionChart(vizContainer, taxonomyData.data);
        } else {
            vizContainer.innerHTML = `
                <div style="text-align: center; color: #86868b;">
                    <h3>Visualization: ${taxonomyData.visualization}</h3>
                    <p>Interactive ${taxonomyData.visualization} chart would be rendered here</p>
                    <p style="font-size: 14px; margin-top: 20px;">
                        Data contains ${taxonomyData.data.totalNodes || taxonomyData.data.data?.length || 0} items
                    </p>
                </div>
            `;
        }
    }

    renderDistributionChart(container, data) {
        const topItems = data.topValues.slice(0, 10);

        container.innerHTML = `
            <div style="padding: 20px; width: 100%;">
                <h4 style="margin-bottom: 16px;">Top ${data.data[0]?.value || 'Items'} Distribution</h4>
                ${topItems.map(item => `
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="width: 120px; font-size: 12px; color: #424245;">${item.value}</div>
                        <div style="flex: 1; height: 20px; background: #f5f5f7; border-radius: 4px; margin: 0 8px; position: relative;">
                            <div style="height: 100%; width: ${(item.count / topItems[0].count) * 100}%; background: #007aff; border-radius: 4px;"></div>
                        </div>
                        <div style="width: 40px; font-size: 12px; color: #86868b; text-align: right;">${item.count}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============= ANALYTICS =============

    async loadAnalytics() {
        try {
            // Load basic stats
            await Promise.all([
                this.updateCompanyStats(),
                this.updateMatchStats(),
                this.updateProfileStats()
            ]);

            // Load activity log
            this.loadActivityLog();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    async updateCompanyStats() {
        document.getElementById('total-companies').textContent = this.companies.length;

        if (this.companies.length > 0) {
            const avgCompleteness = this.companies.reduce((sum, c) => sum + (c.profileCompleteness || 0), 0) / this.companies.length;
            document.getElementById('avg-completeness').textContent = `${Math.round(avgCompleteness)}%`;
        }
    }

    async updateMatchStats() {
        // Placeholder - would query matches collection
        document.getElementById('total-matches').textContent = '0';
    }

    async updateProfileStats() {
        document.getElementById('active-profiles').textContent = this.weightsProfiles.length;
    }

    loadActivityLog() {
        const tbody = document.getElementById('activity-tbody');

        // Placeholder activity data
        tbody.innerHTML = `
            <tr>
                <td>Upload Data</td>
                <td>admin@example.com</td>
                <td>companies.csv</td>
                <td>${new Date().toLocaleString()}</td>
            </tr>
            <tr>
                <td>Create Profile</td>
                <td>admin@example.com</td>
                <td>Publisher Focused</td>
                <td>${new Date(Date.now() - 3600000).toLocaleString()}</td>
            </tr>
        `;
    }

    // ============= UTILITIES =============

    showMessage(type, message) {
        const messagesDiv = document.getElementById('upload-messages');

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        messagesDiv.appendChild(messageEl);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    async getAuthToken() {
        // In a real implementation, this would get the Firebase auth token
        // For now, return a placeholder
        return 'placeholder-token';
    }
}

// Initialize the admin panel
const admin = new MatchmakingAdmin();