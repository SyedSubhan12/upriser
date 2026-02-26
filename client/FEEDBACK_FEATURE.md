# ⭐ Feedback Popup Feature

I've added a smart feedback popup that asks users for their rating after they've been logged in for a while.

## Features

1. **Automatic Trigger**: Appears automatically after a set delay (default: 2 minutes).
2. **Persistence**: 
   - Uses `localStorage` to remember if a user has already submitted feedback.
   - Won't annoy users who have already rated.
   - Can be configured to show again after X days (currently set to 7 days in `useFeedbackStore.ts`).
3. **Emoji Rating**: Uses the interactive emoji component you requested.
4. **Conditional**: Only shows for **logged-in** users.

## Configuration

### Changing the Wait Time

Open `client/src/App.tsx` and find:

```tsx
<FeedbackPopup delayMinutes={2} />
```

Change `2` to whatever number of minutes you want.

### Resetting for Testing

Since the app remembers if you've seen the popup, you might need to reset it to test again:

1. Open DevTools (F12)
2. Go to **Application** > **Local Storage**
3. Delete `feedback-storage`
4. Refresh the page

## Future Backend Integration

Currently, the feedback is logged to the console:
```js
console.log("Feedback submitted:", { rating, comment, ... })
```

To save this to your database in the future:
1. Create a `feedback` table in `shared/schema.ts`
2. Create a `POST /api/feedback` route in `server/routes.ts`
3. Uncomment the fetch call in `client/src/components/FeedbackPopup.tsx`
