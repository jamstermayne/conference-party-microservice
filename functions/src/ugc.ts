import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * 🎉 CREATE UGC EVENT ENDPOINT
 * Handles user-generated event creation
 */
export const createUGCEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Creating UGC event:', req.body);
        
        const eventData = req.body;
        
        // Validate required fields including creator
        if (!eventData.name || !eventData.creator || !eventData.date || !eventData.startTime || !eventData.venue) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: name, creator, date, startTime, venue'
            });
            return;
        }

        // Validate creator field
        if (typeof eventData.creator !== 'string' || eventData.creator.trim().length < 2) {
            res.status(400).json({
                success: false,
                error: 'Creator name must be at least 2 characters long'
            });
            return;
        }

        if (eventData.creator.trim().length > 100) {
            res.status(400).json({
                success: false,
                error: 'Creator name cannot exceed 100 characters'
            });
            return;
        }

        // Generate unique ID
        const eventId = `ugc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // Create event object
        const ugcEvent = {
            id: eventId,
            name: eventData.name,
            creator: eventData.creator.trim(),
            date: eventData.date,
            startTime: eventData.startTime,
            venue: eventData.venue,
            category: eventData.eventType || 'networking',
            description: eventData.description || '',
            hosts: eventData.creator.trim(),
            source: 'ugc',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // Add some default fields for compatibility
            endTime: null,
            coordinates: null,
            address: eventData.venue
        };
        
        // Save to Firestore
        const db = getFirestore();
        await db.collection('events').doc(eventId).set(ugcEvent);
        
        console.log('UGC event created successfully:', eventId);
        
        // Return success response
        res.json({
            success: true,
            eventId: eventId,
            message: 'Event created successfully',
            event: ugcEvent
        });
        
    } catch (error) {
        console.error('UGC Event Creation Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event'
        });
    }
};

/**
 * 📊 GET UGC EVENTS ENDPOINT
 * Returns user-generated events
 */
export const getUGCEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Fetching UGC events...');
        
        const db = getFirestore();
        const ugcEvents = await db.collection('events')
            .where('source', '==', 'ugc')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        const events = ugcEvents.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Found ${events.length} UGC events`);
        
        res.json({
            success: true,
            events: events,
            count: events.length
        });
        
    } catch (error) {
        console.error('Get UGC Events Error:', error);
        res.status(500).json({
            success: false,
            events: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
