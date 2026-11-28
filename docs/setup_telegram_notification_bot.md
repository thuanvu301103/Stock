# Set Up Telegram Notifications

This guide explains how to create a Telegram bot and configure an n8n Telegram node to send notifications to a personal chat or group.

## Step 1: Create a bot and obtain credentials

### Create the bot

1. Open Telegram and search for the official `@BotFather` account.
2. Start a conversation and send `/newbot`.
3. Enter a display name for the bot, for example `Alert System Bot`.
4. Enter a unique bot username. It must end with `bot`, for example `system_alert_2026_bot`.
5. BotFather will return an HTTP API token such as:

   ```text
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

Keep this token secure. Do not commit it to Git or expose it in workflow exports.

### Find a personal chat ID

1. Open the bot in Telegram and click **Start**, or send it any message.
2. Replace `<BOT_TOKEN>` with the bot token and open:

   ```text
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```

3. Find the first `chat` object in the JSON response. Its `id` value is the personal chat ID.

### Find a group chat ID

1. Add the bot to the Telegram group.
2. Grant the bot permission to send messages if the group requires it.
3. Send a message in the group.
4. Open the same `/getUpdates` URL as above and find the group in the response.
5. Use the negative chat `id`, for example `-1001234567890`.

If `/getUpdates` is empty, send a new message to the bot or group and retry.

## Step 2: Configure the Telegram node in n8n

1. Open or create an n8n workflow.
2. Click **+** to add a node.
3. Search for **Telegram** and select it.
4. Set the action to **Send a text message** (named **Send message** in some n8n versions).

### Create the credential

1. In **Credential to connect with**, select **Create New Credential**.
2. Paste the HTTP API token from BotFather into the access-token field.
3. Save the credential.
4. Test or save the credential if n8n offers a connection check.

### Configure the message

1. Set **Chat ID** to the personal or group chat ID.
2. Use a fixed chat ID or an n8n expression, for example:

   ```text
   {{ $json.chat_id }}
   ```

3. Set **Text** to the notification content. Expressions can read values from earlier nodes, for example:

   ```text
   Task status: {{ $json.status }}
   Time: {{ $json.timestamp }}
   ```

### Optional fields

- **Parse Mode:** Use `Markdown` or `HTML` to format bold text, italics, code blocks, or links.
- **Disable Notification:** Enable this option to send the message silently.
- **Reply to Message ID:** Use this to reply to a specific Telegram message.

Telegram message formatting can vary by client. If a formatted message fails to send, verify the syntax or switch to plain text.

## Step 3: Test the notification

1. Open the Telegram node.
2. Confirm that the credential and chat ID are configured.
3. Click **Execute step**.
4. Check that the Telegram API response is successful and that the message appears in the target chat.

If the message is not delivered, verify that:

- The bot token is correct and is stored in an active n8n credential.
- The personal user has started the bot.
- The bot has permission to post in the group.
- The chat ID is correct, including the negative sign for groups.
- The workflow is active and the node is placed after the notification trigger or source data.