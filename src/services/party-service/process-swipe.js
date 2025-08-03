/**
 * Party Swipe Microservice
 * Function: processSwipe() → swipe result
 * Single Purpose: Process user swipe action (interested/pass)
 * Genesis Compliance: ≤95 lines
 */

function processSwipe(swipeData) {
    const { userId, partyId, action, sessionId } = swipeData;

    // Validate required fields
    if (!userId || !partyId || !action) {
        return {
            success: false,
            error: "Missing required fields: userId, partyId, action",
            code: "INVALID_INPUT"
        };
    }

    // Validate action type
    const validActions = ['interested', 'pass'];
    if (!validActions.includes(action)) {
        return {
            success: false,
            error: "Invalid action. Use 'interested' or 'pass'",
            code: "INVALID_ACTION"
        };
    }

    // Generate unique swipe ID
    const swipeId = `swipe_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    // Process the swipe
    const swipeResult = {
        id: swipeId,
        userId,
        partyId, 
        action,
        timestamp,
        sessionId: sessionId || null
    };

    // Determine next action based on swipe
    let nextAction = null;
    let message = null;

    if (action === 'interested') {
        message = "Party saved!";
        nextAction = "calendar_sync_available";
    } else {
        message = "Thanks for the feedback!";
        nextAction = "continue_swiping";
    }

    // Return single result
    const result = {
        success: true,
        swipe: swipeResult,
        message,
        nextAction
    };

    return result;
}

module.exports = { processSwipe };
