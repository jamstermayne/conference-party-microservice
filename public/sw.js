/**
 * 🚀 GAMESCOM 2025 PARTY DISCOVERY - SERVICE WORKER
 * 
 * Offline-first PWA functionality with intelligent caching
 * Generated: 2025-08-17T02:16:46.825Z
 * Cache Version: 1.0.0
 */

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = 'gamescom-party-discovery-v1';
const DATA_CACHE = 'gamescom-data-v1';
const RUNTIME_CACHE = 'gamescom-runtime-v1';

// Essential files to cache immediately
const ESSENTIAL_CACHE = [
    '/',
    '/index.html',
    '/css/app.css',
    '/js/app.js',
    '/js/pwa-init.js',
    '/js/cache-utils.js', 
    '/js/offline-search.js',
    '/offline-data/search-index.json',
    '/offline-data/events.json',
    '/manifest.json'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
    /\/api\/parties/,
    /\/api\/events/,
    /\/api\/search/,
    /\/api\/venues/
];

// Static assets for stale-while-revalidate
const STATIC_CACHE_PATTERNS = [
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/
];

/**
 * 📦 SERVICE WORKER INSTALLATION
 */
self.addEventListener('install', event => {
    console.log('🚀 Service Worker installing, version:', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // Cache essential files
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 Caching essential files...');
                return cache.addAll(ESSENTIAL_CACHE);
            }),
            
            // Cache PWA search data
            cacheSearchData(),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

/**
 * 🔄 SERVICE WORKER ACTIVATION
 */
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated, version:', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ])
    );
});

/**
 * 🌐 FETCH REQUEST HANDLING
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(networkFirstStrategy(request));
    } else if (STATIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else if (url.pathname.startsWith('/offline-data/')) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(
            request.mode === 'navigate' 
                ? networkFirstStrategy(request)
                : cacheFirstStrategy(request)
        );
    }
});

/**
 * 🔄 BACKGROUND SYNC
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(backgroundSync());
    }
});

/**
 * 📊 CACHE PWA SEARCH DATA
 */
async function cacheSearchData() {
    try {
        const dataCache = await caches.open(DATA_CACHE);
        const searchData = {"generated":"2025-08-06T19:39:27.657Z","version":"1.0.0","totalEvents":58,"events":[{"id":"beam---avalanche-go-gamescom-wed-aug-20-18-00-rheinloft-cologne--frankenwerft-35--50667--germany","name":"Beam & Avalanche go Gamescom","date":"2025-08-20","startTime":"18:00","endTime":"23:00","category":"Mixer","hosts":"Beam, Avalanche","address":"Rheinloft Cologne, Frankenwerft 35, 50667, Germany","coordinates":{"lat":50.939281,"lng":6.962183},"keywords":["mixer","beam","avalanche","gamescom","rheinloft","cologne","frankenwerft","50667","germany","wed"],"venues":["Rheinloft Cologne"]},{"id":"cigar-lovers-wed-aug-20-21-00-turiner-strabe-9--cologne--germany","name":"Cigar Lovers","date":"2025-08-20","startTime":"21:00","endTime":"23:59","category":"Exec Social","hosts":"Bring Your Own","address":"Turiner Strabe 9, cologne, germany","coordinates":{"lat":50.946421,"lng":6.957213},"keywords":["exec social","bring your own","cigar","lovers","turiner","strabe","cologne","germany","wed","aug"],"venues":["Turiner Strabe 9"]},{"id":"courage-cologne---devcom-developer-night-2025-tue-aug-19-20-00-herbrand-s--herbrandstraoe-21--50825-","name":"Courage Cologne @ devcom Developer Night 2025","date":"2025-08-19","startTime":"20:00","endTime":"23:30","category":"Party","hosts":"devcom","address":"HERBRAND's, Herbrandstraoe 21, 50825, Germany","coordinates":{"lat":50.951405,"lng":6.910447},"keywords":["party","devcom","courage","cologne","developer","night","2025","herbrands","herbrandstraoe","50825"],"venues":["HERBRAND's"]},{"id":"devcom-developer-conference-leadership-dinner-mon-aug-18-19-30-kolnmesse-confex--kolnmesse-confex-50","name":"devcom Developer Conference Leadership Dinner","date":"2025-08-18","startTime":"19:30","endTime":"23:30","category":"Mixer","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["mixer","devcom","developer","conference","leadership","dinner","kolnmesse","confex","50679","koln"],"venues":["Kolnmesse Confex"]},{"id":"devcom-developer-conference-mon-aug-18-09-00-koelnmesse-confex--kolnmesse-confex-50679-koln-germany","name":"devcom Developer Conference","date":"2025-08-18","startTime":"09:00","endTime":"23:30","category":"Meetings","hosts":"devcom","address":"Koelnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["meetings","devcom","developer","conference","koelnmesse","confex","kolnmesse","50679","koln","germany"],"venues":["Koelnmesse Confex"]},{"id":"devcom-developer-conference-pitch-it--mixer-tue-aug-19-14-30-kolnmesse-confex--kolnmesse-confex-5067","name":"devcom Developer Conference pitch it! Mixer","date":"2025-08-19","startTime":"14:30","endTime":"17:00","category":"Meetings","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["meetings","devcom","developer","conference","pitch","mixer","kolnmesse","confex","50679","koln"],"venues":["Kolnmesse Confex"]},{"id":"devcom-developer-conference-sun-aug-17-13-00-koelnmesse-confex--kolnmesse-confex-50679-koln-germany","name":"devcom Developer Conference","date":"2025-08-17","startTime":"13:00","endTime":"16:00","category":"Meetings","hosts":"devcom","address":"Koelnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["meetings","devcom","developer","conference","koelnmesse","confex","kolnmesse","50679","koln","germany"],"venues":["Koelnmesse Confex"]},{"id":"devcom-developer-conference-sunset-mixer-mon-aug-18-19-30-kolnmesse-confex--kolnmesse-confex-50679-k","name":"devcom Developer Conference Sunset Mixer","date":"2025-08-18","startTime":"19:30","endTime":"23:30","category":"Mixer","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["mixer","devcom","developer","conference","sunset","kolnmesse","confex","50679","koln","germany"],"venues":["Kolnmesse Confex"]},{"id":"devcom-developer-conference-tue-aug-19-09-00-kolnmesse-confex--kolnmesse-confex-50679-koln-germany","name":"devcom Developer Conference","date":"2025-08-19","startTime":"09:00","endTime":"20:00","category":"Meetings","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["meetings","devcom","developer","conference","kolnmesse","confex","50679","koln","germany","tue"],"venues":["Kolnmesse Confex"]},{"id":"devcom-developer-conference-vip-mixer-mon-aug-18-17-00-kolnmesse-confex--kolnmesse-confex-50679-koln","name":"devcom Developer Conference VIP Mixer","date":"2025-08-18","startTime":"17:00","endTime":"19:00","category":"Mixer","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["mixer","devcom","developer","conference","vip","kolnmesse","confex","50679","koln","germany"],"venues":["Kolnmesse Confex"]},{"id":"devcom-developer-conference-vip-mixer-tue-aug-19-17-00-kolnmesse-confex--kolnmesse-confex-50679-koln","name":"devcom Developer Conference VIP Mixer","date":"2025-08-19","startTime":"17:00","endTime":"19:00","category":"Mixer","hosts":"devcom","address":"Kolnmesse Confex, Kolnmesse Confex 50679 Koln Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["mixer","devcom","developer","conference","vip","kolnmesse","confex","50679","koln","germany"],"venues":["Kolnmesse Confex"]},{"id":"diversion-meetup-ddc-happy-hour-tue-aug-19-18-00-craftbeer-corner-coeln--martinstraoe-32--50667--ger","name":"Diversion Meetup DDC Happy Hour","date":"2025-08-19","startTime":"18:00","endTime":"21:00","category":"Mixer","hosts":"Diversion","address":"Craftbeer Corner Coeln, Martinstraoe 32, 50667, Germany","coordinates":{"lat":50.937259,"lng":6.958867},"keywords":["mixer","diversion","meetup","ddc","happy","hour","craftbeer","corner","coeln","martinstraoe"],"venues":["Craftbeer Corner Coeln"]},{"id":"diversity-meetup-x-home-of-indies---gamescom-2025-sat-aug-23-14-00-home-of-indies--hall-10-2--e010g-","name":"Diversity Meetup x Home of Indies @ Gamescom 2025","date":"2025-08-23","startTime":"14:00","endTime":"16:00","category":"Mixer","hosts":"Content Affairs","address":"Home of Indies, Hall 10.2, E010g-D011g, Messeplatz 1, 50679 Cologne, Germany","coordinates":{"lat":50.94678,"lng":6.983207},"keywords":["mixer","content affairs","diversity","meetup","home","indies","gamescom","2025","hall","102"],"venues":["Home of Indies"]},{"id":"drinks--games-from-portugal-pavilion-thu-aug-21-16-00-hall-2-1-c028-d027--koelnmesse--cologne","name":"Drinks@ Games From Portugal Pavilion","date":"2025-08-21","startTime":"16:00","endTime":"18:00","category":"Mixer","hosts":"DevGAMM, eGames","address":"Hall 2.1 C028-D027, Koelnmesse, Cologne","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","devgamm","egames","drinks","games","from","portugal","pavilion","hall","c028d027"],"venues":["Hall 2.1 C028-D027"]},{"id":"enchant-gamescom-pitch-party---networking-after-party-thu-aug-21-18-45-startplatz--mediapark-5--5067","name":"Enchant Gamescom Pitch Party + Networking After Party","date":"2025-08-21","startTime":"18:45","endTime":"22:30","category":"Party","hosts":"Enchant","address":"STARTPLATZ, Mediapark 5, 50670, Germany","coordinates":{"lat":50.948635,"lng":6.944796},"keywords":["party","enchant","gamescom","pitch","networking","after","startplatz","mediapark","50670","germany"],"venues":["STARTPLATZ"]},{"id":"game-audio-get-together--gamescom-2025-fri-aug-22-19-30-salzgasse-2--50667--germany","name":"Game Audio Get Together @Gamescom 2025","date":"2025-08-22","startTime":"19:30","endTime":"21:00","category":"Mixer","hosts":"Flutu Music","address":"Salzgasse 2, 50667, Germany","coordinates":{"lat":50.937507,"lng":6.961264},"keywords":["mixer","flutu music","game","audio","get","together","gamescom","2025","salzgasse","50667"],"venues":["Salzgasse 2"]},{"id":"games-industry-runners-gamescom-edition-wed-aug-20-07-30-paolozzibrunnen--weltjugendtagsweg--50667--","name":"Games Industry Runners Gamescom edition","date":"2025-08-20","startTime":"07:30","endTime":"09:00","category":"Wellness","hosts":"Kohort, Newzoo","address":"Paolozzibrunnen, Weltjugendtagsweg, 50667, Germany","coordinates":{"lat":50.940482,"lng":6.962301},"keywords":["wellness","kohort","newzoo","games","industry","runners","gamescom","edition","paolozzibrunnen","weltjugendtagsweg"],"venues":["Paolozzibrunnen"]},{"id":"gamescom-2025-happy-hour-----by-overwolf-thu-aug-21-16-30-cologne-fair--messeplatz-1--50679--germany","name":"Gamescom 2025 Happy Hour â€“ By Overwolf","date":"2025-08-21","startTime":"16:30","endTime":"18:00","category":"Mixer","hosts":"Overwolf","address":"Cologne Fair, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","overwolf","gamescom","2025","happy","hour","cologne","fair","messeplatz","50679"],"venues":["Cologne Fair"]},{"id":"gamescom-2025-happy-hour---by-overwolf-thu-aug-21-16-30-cologne-fair--messeplatz-1--50679--germany","name":"Gamescom 2025 Happy Hour - By Overwolf","date":"2025-08-21","startTime":"16:30","endTime":"18:00","category":"Mixer","hosts":"Overwolf","address":"Cologne Fair, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","overwolf","gamescom","2025","happy","hour","cologne","fair","messeplatz","50679"],"venues":["Cologne Fair"]},{"id":"gamescom-2025-networking-mixer--metric-minds-wed-aug-20-18-00-joe-champs-american-sports-bar--consta","name":"Gamescom 2025 Networking Mixer: Metric Minds","date":"2025-08-20","startTime":"18:00","endTime":"21:00","category":"Mixer","hosts":"Society for Game Cinematics","address":"Joe Champs American Sports Bar, Constantinstrasse 96 50679 Koln Germany","coordinates":{"lat":50.938805,"lng":6.977965},"keywords":["mixer","society for game cinematics","gamescom","2025","networking","metric","minds","joe","champs","american"],"venues":["Joe Champs American Sports Bar"]},{"id":"gamescom-inside--brand-positioning-group-tour-fri-aug-22-13-30-the-ash-messecity--luise-straus-ernst","name":"Gamescom Inside: Brand Positioning Group Tour","date":"2025-08-22","startTime":"13:30","endTime":"15:00","category":"Tour","hosts":"Walbert-Schmitz","address":"The ASH MesseCity, Luise-Straus-Ernst-Straoe 4, 50679, Germany","coordinates":{"lat":50.941449,"lng":6.978014},"keywords":["tour","walbert-schmitz","gamescom","inside","brand","positioning","group","the","ash","messecity"],"venues":["The ASH MesseCity"]},{"id":"gamescom-inside--brand-positioning-group-tour-thu-aug-21-13-30-the-ash-messecity--luise-straus-ernst","name":"Gamescom Inside: Brand Positioning Group Tour","date":"2025-08-21","startTime":"13:30","endTime":"15:00","category":"Tour","hosts":"Walbert-Schmitz","address":"The ASH MesseCity, Luise-Straus-Ernst-Straoe 4, 50679, Germany","coordinates":{"lat":50.941449,"lng":6.978014},"keywords":["tour","walbert-schmitz","gamescom","inside","brand","positioning","group","the","ash","messecity"],"venues":["The ASH MesseCity"]},{"id":"gamescom-launch-party-tue-aug-19-20-00-rooftop58--hohenzollernring-58--50672--germany","name":"Gamescom Launch Party","date":"2025-08-19","startTime":"20:00","endTime":"00:00","category":"Party","hosts":"Singular, Google, Stash","address":"rooftop58, Hohenzollernring 58, 50672, Germany","coordinates":{"lat":50.939928,"lng":6.940236},"keywords":["party","singular","google","stash","gamescom","launch","rooftop58","hohenzollernring","50672","germany"],"venues":["rooftop58"]},{"id":"global-xrai-hack-at-cologne--gamescom-mon-aug-18-09-00-startplatz--im-mediapark-5--50670--germany","name":"Global XRAI Hack at Cologne, Gamescom","date":"2025-08-18","startTime":"09:00","endTime":"19:00","category":"Hackathon","hosts":"XR Bootcamp, Meta","address":"STARTPLATZ, Im Mediapark 5, 50670, Germany","coordinates":{"lat":50.948635,"lng":6.944796},"keywords":["hackathon","xr bootcamp","meta","global","xrai","hack","cologne","gamescom","startplatz","mediapark"],"venues":["STARTPLATZ"]},{"id":"global-xrai-hack-at-cologne--gamescom-sun-aug-17-09-00-startplatz--im-mediapark-5--50670--germany","name":"Global XRAI Hack at Cologne, Gamescom","date":"2025-08-17","startTime":"09:00","endTime":"19:00","category":"Hackathon","hosts":"XR Bootcamp, Meta","address":"STARTPLATZ, Im Mediapark 5, 50670, Germany","coordinates":{"lat":50.948635,"lng":6.944796},"keywords":["hackathon","xr bootcamp","meta","global","xrai","hack","cologne","gamescom","startplatz","mediapark"],"venues":["STARTPLATZ"]},{"id":"global-xrai-hack-at-cologne--gamescom-tue-aug-19-09-00-startplatz--im-mediapark-5--50670--germany","name":"Global XRAI Hack at Cologne, Gamescom","date":"2025-08-19","startTime":"09:00","endTime":"19:00","category":"Hackathon","hosts":"XR Bootcamp, Meta","address":"STARTPLATZ, Im Mediapark 5, 50670, Germany","coordinates":{"lat":50.948635,"lng":6.944796},"keywords":["hackathon","xr bootcamp","meta","global","xrai","hack","cologne","gamescom","startplatz","mediapark"],"venues":["STARTPLATZ"]},{"id":"indie-developer-stammtisch-sun-aug-17-17-00-hostel---the-shared-apartment--richard-wagner-straoe-39-","name":"Indie Developer Stammtisch","date":"2025-08-17","startTime":"17:00","endTime":"19:00","category":"Mixer","hosts":"INDIE Hub","address":"Hostel | the shared apartment, Richard-Wagner-Straoe 39, 50674, Germany","coordinates":{"lat":50.935296,"lng":6.934854},"keywords":["mixer","indie hub","indie","developer","stammtisch","hostel","the","shared","apartment","richardwagnerstraoe"],"venues":["Hostel | the shared apartment"]},{"id":"indie-reveal-during-gamescom-2025-wed-aug-20-19-30-filmforum-nrw--bischofsgartenstrasse-1-50667-koln","name":"INDIE Reveal during Gamescom 2025","date":"2025-08-20","startTime":"19:30","endTime":"22:00","category":"Game Pitches","hosts":"INDIE Hub UG","address":"Filmforum NRW, Bischofsgartenstrasse 1 50667 Koln Germany","coordinates":{"lat":50.940628,"lng":6.959619},"keywords":["game pitches","indie hub ug","indie","reveal","during","gamescom","2025","filmforum","nrw","bischofsgartenstrasse"],"venues":["Filmforum NRW"]},{"id":"karaoke---the-copper-pot-wed-aug-20-21-00-bolzengasse-7--cologne--germany-50667","name":"Karaoke | The Copper Pot","date":"2025-08-20","startTime":"21:00","endTime":"23:59","category":"Social","hosts":"You + 50 Friends","address":"Bolzengasse 7, Cologne, Germany 50667","coordinates":{"lat":50.936707,"lng":6.959759},"keywords":["social","you + 50 friends","karaoke","the","copper","pot","bolzengasse","cologne","germany","50667"],"venues":["Bolzengasse 7"]},{"id":"karaoke---the-jameson-irish-pub-fri-aug-22-20-00-friesenstraue-30-40--50670-koln--cologne","name":"Karaoke | The Jameson Irish Pub","date":"2025-08-22","startTime":"20:00","endTime":"23:59","category":"Social","hosts":"You + 50 Friends","address":"Friesenstraue 30-40, 50670 Koln, Cologne","coordinates":{"lat":50.949735,"lng":6.943474},"keywords":["social","you + 50 friends","karaoke","the","jameson","irish","pub","friesenstraue","3040","50670"],"venues":["Friesenstraue 30-40"]},{"id":"liveops-networking-meetup-mon-aug-18-16-30-koelnmesse-confex--koelnmesse-halle-1--50679--germany","name":"LiveOps Networking Meetup","date":"2025-08-18","startTime":"16:30","endTime":"18:00","category":"Mixer","hosts":"Oscar Clark","address":"Koelnmesse Confex, Koelnmesse Halle 1, 50679, Germany","coordinates":{"lat":50.942986,"lng":6.975316},"keywords":["mixer","oscar clark","liveops","networking","meetup","koelnmesse","confex","halle","50679","germany"],"venues":["Koelnmesse Confex"]},{"id":"maraoke-live----gamescom-2025-wed-aug-20-19-00-turistarama--mauritiussteinweg-102--50676--germany","name":"Maraoke LIVE! @ Gamescom 2025","date":"2025-08-20","startTime":"19:00","endTime":"23:59","category":"Party","hosts":"Maraoke LIVE","address":"TURISTARAMA, Mauritiussteinweg 102, 50676, Germany","coordinates":{"lat":50.934525,"lng":6.945256},"keywords":["party","maraoke live","maraoke","live","gamescom","2025","turistarama","mauritiussteinweg","102","50676"],"venues":["TURISTARAMA"]},{"id":"marketers-in-gaming--meetup--gamescom-2025-wed-aug-20-18-00-the-copper-pot--bolzengasse-7--50667--ge","name":"Marketers In Gaming  Meetup @Gamescom 2025","date":"2025-08-20","startTime":"18:00","endTime":"21:00","category":"Mixer","hosts":"1minus1","address":"The Copper Pot, Bolzengasse 7, 50667, Germany","coordinates":{"lat":50.936718,"lng":6.959742},"keywords":["mixer","1minus1","marketers","gaming","meetup","gamescom","2025","the","copper","pot"],"venues":["The Copper Pot"]},{"id":"marriott-madness-mon-aug-18-19-30-johannisstraue-76-80--50668-koln--germany","name":"Marriott Madness","date":"2025-08-18","startTime":"19:30","endTime":"23:59","category":"Exec Social","hosts":"Marriott Bar","address":"Johannisstraue 76-80, 50668 Koln, Germany","coordinates":{"lat":50.945308,"lng":6.961333},"keywords":["exec social","marriott bar","marriott","madness","johannisstraue","7680","50668","koln","germany","mon"],"venues":["Johannisstraue 76-80"]},{"id":"marriott-madness-thu-aug-21-19-30-johannisstraue-76-80--50668-koln--germany","name":"Marriott Madness","date":"2025-08-21","startTime":"19:30","endTime":"23:59","category":"Exec Social","hosts":"Marriott Bar","address":"Johannisstraue 76-80, 50668 Koln, Germany","coordinates":{"lat":50.945308,"lng":6.961333},"keywords":["exec social","marriott bar","marriott","madness","johannisstraue","7680","50668","koln","germany","thu"],"venues":["Johannisstraue 76-80"]},{"id":"marriott-madness-tue-aug-19-19-30-johannisstraue-76-80--50668-koln--germany","name":"Marriott Madness","date":"2025-08-19","startTime":"19:30","endTime":"23:59","category":"Exec Social","hosts":"Marriott Bar","address":"Johannisstraue 76-80, 50668 Koln, Germany","coordinates":{"lat":50.945308,"lng":6.961333},"keywords":["exec social","marriott bar","marriott","madness","johannisstraue","7680","50668","koln","germany","tue"],"venues":["Johannisstraue 76-80"]},{"id":"marriott-madness-wed-aug-20-19-30-johannisstraue-76-80--50668-koln--germany","name":"Marriott Madness","date":"2025-08-20","startTime":"19:30","endTime":"23:59","category":"Exec Social","hosts":"Marriott Bar","address":"Johannisstraue 76-80, 50668 Koln, Germany","coordinates":{"lat":50.945308,"lng":6.961333},"keywords":["exec social","marriott bar","marriott","madness","johannisstraue","7680","50668","koln","germany","wed"],"venues":["Johannisstraue 76-80"]},{"id":"meettomatch-the-cologne-edition-2025-fri-aug-22-09-00-koelnmesse--messeplatz-1--50679--germany","name":"MeetToMatch The Cologne Edition 2025","date":"2025-08-22","startTime":"09:00","endTime":"18:00","category":"Mixer","hosts":"Xsolla","address":"Koelnmesse, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","xsolla","meettomatch","the","cologne","edition","2025","koelnmesse","messeplatz","50679"],"venues":["Koelnmesse"]},{"id":"meettomatch-the-cologne-edition-2025-mon-aug-18-10-00-koelnmesse--messeplatz-1-50679-koln-germany","name":"MeetToMatch The Cologne Edition 2025","date":"2025-08-18","startTime":"10:00","endTime":"15:00","category":"Meetings","hosts":"Xsolla","address":"Koelnmesse, Messeplatz 1 50679 Koln Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["meetings","xsolla","meettomatch","the","cologne","edition","2025","koelnmesse","messeplatz","50679"],"venues":["Koelnmesse"]},{"id":"meettomatch-the-cologne-edition-2025-thu-aug-21-09-00-koelnmesse--messeplatz-1--50679--germany","name":"MeetToMatch The Cologne Edition 2025","date":"2025-08-21","startTime":"09:00","endTime":"18:00","category":"Mixer","hosts":"Xsolla","address":"Koelnmesse, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","xsolla","meettomatch","the","cologne","edition","2025","koelnmesse","messeplatz","50679"],"venues":["Koelnmesse"]},{"id":"meettomatch-the-cologne-edition-2025-tue-aug-19-10-00-koelnmesse--messeplatz-1-50679-koln-germany","name":"MeetToMatch The Cologne Edition 2025","date":"2025-08-19","startTime":"10:00","endTime":"15:00","category":"Meetings","hosts":"Xsolla","address":"Koelnmesse, Messeplatz 1 50679 Koln Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["meetings","xsolla","meettomatch","the","cologne","edition","2025","koelnmesse","messeplatz","50679"],"venues":["Koelnmesse"]},{"id":"meettomatch-the-cologne-edition-2025-wed-aug-20-09-00-koelnmesse--messeplatz-1--50679--germany","name":"MeetToMatch The Cologne Edition 2025","date":"2025-08-20","startTime":"09:00","endTime":"18:00","category":"Mixer","hosts":"Xsolla","address":"Koelnmesse, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","xsolla","meettomatch","the","cologne","edition","2025","koelnmesse","messeplatz","50679"],"venues":["Koelnmesse"]},{"id":"mixpanel-happy-hour-at-gamescom-thu-aug-21-16-00-hall-2--booth-a034--koelnmesse--cologne","name":"Mixpanel Happy Hour At Gamescom","date":"2025-08-21","startTime":"16:00","endTime":"18:00","category":"Mixer","hosts":"Mixpanel","address":"Hall 2, Booth A034, Koelnmesse, Cologne","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","mixpanel","happy","hour","gamescom","hall","booth","a034","koelnmesse","cologne"],"venues":["Hall 2"]},{"id":"monday-multiplayer-mixer-mon-aug-18-18-00-gilden-im-ziims--heimat-kolscher-helden--cologne--germany","name":"Monday Multiplayer Mixer","date":"2025-08-18","startTime":"18:00","endTime":"22:00","category":"Mixer","hosts":"Modulate, Hathora, Keyword Studios","address":"Gilden im ZIims \"Heimat Kolscher Helden\" Cologne, Germany","coordinates":{"lat":50.937191,"lng":6.960045},"keywords":["mixer","modulate","hathora","keyword studios","monday","multiplayer","gilden","ziims","heimat","kolscher"],"venues":["Gilden im ZIims \"Heimat Kolscher Helden\" Cologne"]},{"id":"pete-s-koln-kick-off-mon-aug-18-16-30-lowenbrau--cologne--frankenwerft-21--50667-koln--germany","name":"Pete's Koln Kick-Off","date":"2025-08-18","startTime":"16:30","endTime":"19:59","category":"Social","hosts":"Pete Lovell","address":"Lowenbrau, Cologne, Frankenwerft 21, 50667 Koln, Germany","coordinates":{"lat":50.937748,"lng":6.962428},"keywords":["social","pete lovell","petes","koln","kickoff","lowenbrau","cologne","frankenwerft","50667","germany"],"venues":["Lowenbrau"]},{"id":"pete-s-koln-kick-off-mon-aug-18-20-00-papa-joe-s-biersalon--alter-markt-50-52--50667-koln--germany","name":"Pete's Koln Kick-Off","date":"2025-08-18","startTime":"20:00","endTime":"23:00","category":"Social","hosts":"Pete Lovell","address":"Papa Joe's Biersalon, Alter Markt 50-52, 50667 Koln, Germany","coordinates":{"lat":50.938817,"lng":6.960397},"keywords":["social","pete lovell","petes","koln","kickoff","papa","joes","biersalon","alter","markt"],"venues":["Papa Joe's Biersalon"]},{"id":"pete-s-koln-kick-off-mon-aug-18-23-00-corkonian-irish-pub--alter-markt-51--50667-koln--germany","name":"Pete's Koln Kick-Off","date":"2025-08-18","startTime":"23:00","endTime":"23:59","category":"Social","hosts":"Pete Lovell","address":"Corkonian Irish Pub, Alter Markt 51, 50667 Koln, Germany","coordinates":{"lat":50.938924,"lng":6.959761},"keywords":["social","pete lovell","petes","koln","kickoff","corkonian","irish","pub","alter","markt"],"venues":["Corkonian Irish Pub"]},{"id":"pocket-gamer-mobile-game-awards-tue-aug-19-18-30-gorzenich-koln--martinstrasse-29-37-50667-koln-germ","name":"Pocket Gamer Mobile Game Awards","date":"2025-08-19","startTime":"18:30","endTime":"23:30","category":"Awards Party","hosts":"Steel Media","address":"Gorzenich Koln, Martinstrasse 29-37 50667 Koln Germany","coordinates":{"lat":50.936539,"lng":6.958605},"keywords":["awards party","steel media","pocket","gamer","mobile","game","awards","gorzenich","koln","martinstrasse"],"venues":["Gorzenich Koln"]},{"id":"pocket-gamer-party-cologne-2025-wed-aug-20-19-30-tivoli--hohe-straoe-14--50667--germany","name":"Pocket Gamer Party Cologne 2025","date":"2025-08-20","startTime":"19:30","endTime":"23:30","category":"Party","hosts":"Steel Media","address":"Tivoli, Hohe Straoe 14, 50667, Germany","coordinates":{"lat":50.934501,"lng":6.956643},"keywords":["party","steel media","pocket","gamer","cologne","2025","tivoli","hohe","straoe","50667"],"venues":["Tivoli"]},{"id":"pubg--hot-drop-cologne-2025-sat-aug-23-17-00-carlswerk-victoria--schanzenstraoe-6-20--gebaude-3-12--","name":"PUBG: HOT DROP Cologne 2025","date":"2025-08-23","startTime":"17:00","endTime":"23:00","category":"Mixer","hosts":"PUBG Studios, Krafton","address":"Carlswerk Victoria, Schanzenstraoe 6-20, Gebaude 3.12, 51063, Germany","coordinates":{"lat":50.965072,"lng":7.01212},"keywords":["mixer","pubg studios","krafton","pubg","hot","drop","cologne","2025","carlswerk","victoria"],"venues":["Carlswerk Victoria"]},{"id":"representing-games---pitch-sessions-cologne-tue-aug-19-12-45-dorint-hotel--pipinstraoe-1--50667--ger","name":"Representing Games | Pitch Sessions Cologne","date":"2025-08-19","startTime":"12:45","endTime":"17:00","category":"Game Pitches","hosts":"MeetToMatch","address":"Dorint Hotel, Pipinstraoe 1, 50667, Germany","coordinates":{"lat":50.935492,"lng":6.957729},"keywords":["game pitches","meettomatch","representing","games","pitch","sessions","cologne","dorint","hotel","pipinstraoe"],"venues":["Dorint Hotel"]},{"id":"run-time--gamescom-5km-social-run-wed-aug-20-07-00-cologne-cathedral--domkloster-4--50667--germany","name":"Run Time: Gamescom 5km Social Run","date":"2025-08-20","startTime":"07:00","endTime":"08:00","category":"Wellness","hosts":"Stephen Hey","address":"Cologne Cathedral, Domkloster 4, 50667, Germany","coordinates":{"lat":50.941278,"lng":6.958281},"keywords":["wellness","stephen hey","run","time","gamescom","5km","social","cologne","cathedral","domkloster"],"venues":["Cologne Cathedral"]},{"id":"safe-in-our-world-reception-at-gamescom-2025-thu-aug-21-16-00-cologne-fair--messeplatz-1--50679--ger","name":"Safe In Our World Reception at Gamescom 2025","date":"2025-08-21","startTime":"16:00","endTime":"19:00","category":"Mixer","hosts":"Safe In Our World","address":"Cologne Fair, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","safe in our world","safe","our","world","reception","gamescom","2025","cologne","fair"],"venues":["Cologne Fair"]},{"id":"saga-ai-agent-pop-up-store-at-gamescom-wed-aug-20-17-00-willy-brandt-platz-3--50679--germany","name":"Saga AI Agent Pop-Up Store at Gamescom","date":"2025-08-20","startTime":"17:00","endTime":"22:00","category":"Mixer","hosts":"Saga xyz","address":"Willy-Brandt-Platz 3, 50679, Germany","coordinates":{"lat":50.938649,"lng":6.984653},"keywords":["mixer","saga xyz","saga","agent","popup","store","gamescom","willybrandtplatz","50679","germany"],"venues":["Willy-Brandt-Platz 3"]},{"id":"serbian-gaming-industry-meet---drinks-wed-aug-20-16-00-cologne-fair--messeplatz-1--50679--germany","name":"Serbian Gaming Industry Meet & Drinks","date":"2025-08-20","startTime":"16:00","endTime":"17:00","category":"Mixer","hosts":"Serbian Games Association","address":"Cologne Fair, Messeplatz 1, 50679, Germany","coordinates":{"lat":50.946605,"lng":6.980405},"keywords":["mixer","serbian games association","serbian","gaming","industry","meet","drinks","cologne","fair","messeplatz"],"venues":["Cologne Fair"]},{"id":"the-xsolla-mixer-with-sensor-tower-mon-aug-18-14-30-hyatt-regency-cologne","name":"The Xsolla Mixer with Sensor Tower","date":"2025-08-18","startTime":"14:30","endTime":"20:30","category":"Mixer","hosts":"Moiblegamer.biz","address":"Hyatt Regency Cologne","coordinates":{"lat":50.94043,"lng":6.969529},"keywords":["mixer","moiblegamer.biz","the","xsolla","with","sensor","tower","hyatt","regency","cologne"],"venues":["Hyatt Regency Cologne"]},{"id":"xrai-hack-pre-gamescom-party-tue-aug-19-19-00-startplatz--im-mediapark-5--50670--germany","name":"XRAI Hack Pre-Gamescom Party","date":"2025-08-19","startTime":"19:00","endTime":"23:30","category":"Bootcamp","hosts":"XR Bootcamp","address":"STARTPLATZ, Im Mediapark 5, 50670, Germany","coordinates":{"lat":50.948635,"lng":6.944796},"keywords":["bootcamp","xr bootcamp","xrai","hack","pregamescom","party","startplatz","mediapark","50670","germany"],"venues":["STARTPLATZ"]},{"id":"you-had-me-at-in-game-data-by-grid---getgud-wed-aug-20-16-00-marzellenstrabe-43a--50668--cologne--ge","name":"You Had Me at In-Game Data by GRID & GetGud","date":"2025-08-20","startTime":"16:00","endTime":"18:30","category":"Party","hosts":"GRID, GetGud","address":"MarzellenstraBe 43a, 50668, Cologne, Germany","coordinates":{"lat":50.944448,"lng":6.955436},"keywords":["party","grid","getgud","you","had","ingame","data","marzellenstrabe","43a","50668"],"venues":["MarzellenstraBe 43a"]}],"filters":{"categories":["Awards Party","Bootcamp","Exec Social","Game Pitches","Hackathon","Meetings","Mixer","Party","Social","Tour","Wellness"],"hosts":["1minus1","Avalanche","Beam","Bring Your Own","Content Affairs","DevGAMM","Diversion","Enchant","Flutu Music","GRID","GetGud","Google","Hathora","INDIE Hub","INDIE Hub UG","Keyword Studios","Kohort","Krafton","Maraoke LIVE","Marriott Bar","MeetToMatch","Meta","Mixpanel","Modulate","Moiblegamer.biz","Newzoo","Oscar Clark","Overwolf","PUBG Studios","Pete Lovell","Safe In Our World","Saga xyz","Serbian Games Association","Singular","Society for Game Cinematics","Stash","Steel Media","Stephen Hey","Walbert-Schmitz","XR Bootcamp","Xsolla","You + 50 Friends","devcom","eGames"],"dates":["2025-08-17","2025-08-18","2025-08-19","2025-08-20","2025-08-21","2025-08-22","2025-08-23"],"venues":["Bolzengasse 7","Carlswerk Victoria","Cologne Cathedral","Cologne Fair","Corkonian Irish Pub","Craftbeer Corner Coeln","Dorint Hotel","Filmforum NRW","Friesenstraue 30-40","Gilden im ZIims \"Heimat Kolscher Helden\" Cologne","Gorzenich Koln","HERBRAND's","Hall 2","Hall 2.1 C028-D027","Home of Indies","Hostel | the shared apartment","Hyatt Regency Cologne","Joe Champs American Sports Bar","Johannisstraue 76-80","Koelnmesse","Koelnmesse Confex","Kolnmesse Confex","Lowenbrau","MarzellenstraBe 43a","Paolozzibrunnen","Papa Joe's Biersalon","Rheinloft Cologne","STARTPLATZ","Salzgasse 2","TURISTARAMA"]},"locationClusters":[{"center":{"lat":50.9392807,"lng":6.9621832},"events":["beam---avalanche-go-gamescom-wed-aug-20-18-00-rheinloft-cologne--frankenwerft-35--50667--germany","diversion-meetup-ddc-happy-hour-tue-aug-19-18-00-craftbeer-corner-coeln--martinstraoe-32--50667--ger","game-audio-get-together--gamescom-2025-fri-aug-22-19-30-salzgasse-2--50667--germany","games-industry-runners-gamescom-edition-wed-aug-20-07-30-paolozzibrunnen--weltjugendtagsweg--50667--","indie-reveal-during-gamescom-2025-wed-aug-20-19-30-filmforum-nrw--bischofsgartenstrasse-1-50667-koln","karaoke---the-copper-pot-wed-aug-20-21-00-bolzengasse-7--cologne--germany-50667","marketers-in-gaming--meetup--gamescom-2025-wed-aug-20-18-00-the-copper-pot--bolzengasse-7--50667--ge","monday-multiplayer-mixer-mon-aug-18-18-00-gilden-im-ziims--heimat-kolscher-helden--cologne--germany","pete-s-koln-kick-off-mon-aug-18-16-30-lowenbrau--cologne--frankenwerft-21--50667-koln--germany","pete-s-koln-kick-off-mon-aug-18-20-00-papa-joe-s-biersalon--alter-markt-50-52--50667-koln--germany","pete-s-koln-kick-off-mon-aug-18-23-00-corkonian-irish-pub--alter-markt-51--50667-koln--germany","pocket-gamer-mobile-game-awards-tue-aug-19-18-30-gorzenich-koln--martinstrasse-29-37-50667-koln-germ","run-time--gamescom-5km-social-run-wed-aug-20-07-00-cologne-cathedral--domkloster-4--50667--germany"],"venue":"Rheinloft Cologne","address":"Rheinloft Cologne - Rooftop Eventlocation für Firmenfeier, Networking, Business Events & Private Feiern, Frankenwerft 35, 50667 Köln, Germany"},{"center":{"lat":50.9464205,"lng":6.957213299999999},"events":["cigar-lovers-wed-aug-20-21-00-turiner-strabe-9--cologne--germany","marriott-madness-mon-aug-18-19-30-johannisstraue-76-80--50668-koln--germany","marriott-madness-thu-aug-21-19-30-johannisstraue-76-80--50668-koln--germany","marriott-madness-tue-aug-19-19-30-johannisstraue-76-80--50668-koln--germany","marriott-madness-wed-aug-20-19-30-johannisstraue-76-80--50668-koln--germany","you-had-me-at-in-game-data-by-grid---getgud-wed-aug-20-16-00-marzellenstrabe-43a--50668--cologne--ge"],"venue":"Turiner Strabe 9","address":"Turiner Str. 9, 50668 Köln, Germany"},{"center":{"lat":50.9514054,"lng":6.9104472},"events":["courage-cologne---devcom-developer-night-2025-tue-aug-19-20-00-herbrand-s--herbrandstraoe-21--50825-"],"venue":"HERBRAND's","address":"Herbrandstraße 21, 50825 Köln, Germany"},{"center":{"lat":50.94298569999999,"lng":6.9753161},"events":["devcom-developer-conference-leadership-dinner-mon-aug-18-19-30-kolnmesse-confex--kolnmesse-confex-50","devcom-developer-conference-mon-aug-18-09-00-koelnmesse-confex--kolnmesse-confex-50679-koln-germany","devcom-developer-conference-pitch-it--mixer-tue-aug-19-14-30-kolnmesse-confex--kolnmesse-confex-5067","devcom-developer-conference-sun-aug-17-13-00-koelnmesse-confex--kolnmesse-confex-50679-koln-germany","devcom-developer-conference-sunset-mixer-mon-aug-18-19-30-kolnmesse-confex--kolnmesse-confex-50679-k","devcom-developer-conference-tue-aug-19-09-00-kolnmesse-confex--kolnmesse-confex-50679-koln-germany","devcom-developer-conference-vip-mixer-mon-aug-18-17-00-kolnmesse-confex--kolnmesse-confex-50679-koln","devcom-developer-conference-vip-mixer-tue-aug-19-17-00-kolnmesse-confex--kolnmesse-confex-50679-koln","gamescom-inside--brand-positioning-group-tour-fri-aug-22-13-30-the-ash-messecity--luise-straus-ernst","gamescom-inside--brand-positioning-group-tour-thu-aug-21-13-30-the-ash-messecity--luise-straus-ernst","liveops-networking-meetup-mon-aug-18-16-30-koelnmesse-confex--koelnmesse-halle-1--50679--germany","the-xsolla-mixer-with-sensor-tower-mon-aug-18-14-30-hyatt-regency-cologne"],"venue":"Kolnmesse Confex","address":"Koelnmesse Halle 1, 50679 Köln, Germany"},{"center":{"lat":50.94678,"lng":6.9832069},"events":["diversity-meetup-x-home-of-indies---gamescom-2025-sat-aug-23-14-00-home-of-indies--hall-10-2--e010g-","drinks--games-from-portugal-pavilion-thu-aug-21-16-00-hall-2-1-c028-d027--koelnmesse--cologne","gamescom-2025-happy-hour-----by-overwolf-thu-aug-21-16-30-cologne-fair--messeplatz-1--50679--germany","gamescom-2025-happy-hour---by-overwolf-thu-aug-21-16-30-cologne-fair--messeplatz-1--50679--germany","meettomatch-the-cologne-edition-2025-fri-aug-22-09-00-koelnmesse--messeplatz-1--50679--germany","meettomatch-the-cologne-edition-2025-mon-aug-18-10-00-koelnmesse--messeplatz-1-50679-koln-germany","meettomatch-the-cologne-edition-2025-thu-aug-21-09-00-koelnmesse--messeplatz-1--50679--germany","meettomatch-the-cologne-edition-2025-tue-aug-19-10-00-koelnmesse--messeplatz-1-50679-koln-germany","meettomatch-the-cologne-edition-2025-wed-aug-20-09-00-koelnmesse--messeplatz-1--50679--germany","mixpanel-happy-hour-at-gamescom-thu-aug-21-16-00-hall-2--booth-a034--koelnmesse--cologne","safe-in-our-world-reception-at-gamescom-2025-thu-aug-21-16-00-cologne-fair--messeplatz-1--50679--ger","serbian-gaming-industry-meet---drinks-wed-aug-20-16-00-cologne-fair--messeplatz-1--50679--germany"],"venue":"Home of Indies","address":"Messepl. 1, 50679 Köln, Germany"},{"center":{"lat":50.9486351,"lng":6.9447956},"events":["enchant-gamescom-pitch-party---networking-after-party-thu-aug-21-18-45-startplatz--mediapark-5--5067","global-xrai-hack-at-cologne--gamescom-mon-aug-18-09-00-startplatz--im-mediapark-5--50670--germany","global-xrai-hack-at-cologne--gamescom-sun-aug-17-09-00-startplatz--im-mediapark-5--50670--germany","global-xrai-hack-at-cologne--gamescom-tue-aug-19-09-00-startplatz--im-mediapark-5--50670--germany","karaoke---the-jameson-irish-pub-fri-aug-22-20-00-friesenstraue-30-40--50670-koln--cologne","xrai-hack-pre-gamescom-party-tue-aug-19-19-00-startplatz--im-mediapark-5--50670--germany"],"venue":"STARTPLATZ","address":"Im Mediapark 5, 50670 Köln, Germany"},{"center":{"lat":50.9388051,"lng":6.9779651},"events":["gamescom-2025-networking-mixer--metric-minds-wed-aug-20-18-00-joe-champs-american-sports-bar--consta","saga-ai-agent-pop-up-store-at-gamescom-wed-aug-20-17-00-willy-brandt-platz-3--50679--germany"],"venue":"Joe Champs American Sports Bar","address":"Constantinstraße 96, 50679 Köln, Germany"},{"center":{"lat":50.9399277,"lng":6.9402364},"events":["gamescom-launch-party-tue-aug-19-20-00-rooftop58--hohenzollernring-58--50672--germany"],"venue":"rooftop58","address":"Hohenzollernring 58, 50672 Köln, Germany"},{"center":{"lat":50.9352955,"lng":6.934854499999999},"events":["indie-developer-stammtisch-sun-aug-17-17-00-hostel---the-shared-apartment--richard-wagner-straoe-39-"],"venue":"Hostel | the shared apartment","address":"Richard-Wagner-Str. 39, 50674 Köln, Germany"},{"center":{"lat":50.93452500000001,"lng":6.945256},"events":["maraoke-live----gamescom-2025-wed-aug-20-19-00-turistarama--mauritiussteinweg-102--50676--germany"],"venue":"TURISTARAMA","address":"Mauritiussteinweg 102, 50676 Köln, Germany"},{"center":{"lat":50.9345009,"lng":6.9566433},"events":["pocket-gamer-party-cologne-2025-wed-aug-20-19-30-tivoli--hohe-straoe-14--50667--germany","representing-games---pitch-sessions-cologne-tue-aug-19-12-45-dorint-hotel--pipinstraoe-1--50667--ger"],"venue":"Tivoli","address":"Hohe Str. 14, 50667 Köln, Germany"},{"center":{"lat":50.9650717,"lng":7.0121199},"events":["pubg--hot-drop-cologne-2025-sat-aug-23-17-00-carlswerk-victoria--schanzenstraoe-6-20--gebaude-3-12--"],"venue":"Carlswerk Victoria","address":"Schanzenstraße 6-20 Gebäude 3.12, 51063 Köln, Germany"}],"defaultLocation":{"lat":50.9466,"lng":6.9804},"config":{"maxDistanceKm":50,"clusterRadiusKm":0.5}};
        
        const searchResponse = new Response(JSON.stringify(searchData), {
            headers: { 'Content-Type': 'application/json' }
        });
        await dataCache.put('/offline-data/search-index.json', searchResponse);
        
        const eventsResponse = new Response(JSON.stringify(searchData.events), {
            headers: { 'Content-Type': 'application/json' }
        });
        await dataCache.put('/offline-data/events.json', eventsResponse);
        
        console.log('📊 Cached search data:', searchData.totalEvents, 'events');
        
    } catch (error) {
        console.error('❌ Failed to cache search data:', error);
    }
}

/**
 * 🌐 NETWORK-FIRST STRATEGY
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') return caches.match('/index.html');
        throw error;
    }
}

/**
 * 📦 CACHE-FIRST STRATEGY
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        if (request.mode === 'navigate') return caches.match('/index.html');
        throw error;
    }
}

/**
 * 🔄 STALE-WHILE-REVALIDATE STRATEGY
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => null);
    
    return cachedResponse || fetchPromise;
}

/**
 * 🧹 CLEANUP OLD CACHES
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith('gamescom-') && 
        name !== CACHE_NAME && 
        name !== DATA_CACHE && 
        name !== RUNTIME_CACHE
    );
    
    return Promise.all(oldCaches.map(cacheName => {
        console.log('🗑️ Deleting old cache:', cacheName);
        return caches.delete(cacheName);
    }));
}

/**
 * 🔄 BACKGROUND SYNC
 */
async function backgroundSync() {
    try {
        console.log('🔄 Background sync started...');
        const response = await fetch('/api/parties');
        if (response.ok) {
            const cache = await caches.open(DATA_CACHE);
            cache.put('/api/parties', response.clone());
            console.log('✅ Background sync completed');
        }
    } catch (error) {
        console.log('❌ Background sync failed:', error.message);
    }
}

console.log('🚀 Service Worker loaded, version:', CACHE_VERSION);