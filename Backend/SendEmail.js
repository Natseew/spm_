// Require the Postmark library
var postmark = require("postmark");

// Create an instance of the Postmark client using your API token
var client = new postmark.ServerClient("ddbc6ace-c43d-4f81-8da2-2637d7b521be");

// Send an email
client.sendEmail({
  "From": "zhenyue.ang.2022@smu.edu.sg",  // Replace with your verified sender email
  "To": "zmcheong.2021@smu.edu.sg",        // Replace with the recipient's email
  "Subject": "Hello from Postmark",
  "HtmlBody": "<strong>Hello</strong> dear Postmark user.",
  "TextBody": "Hello from Postmark!",
  "MessageStream": "notification"  // Ensure this is a valid stream in your Postmark account
}).then(result => {
  // Log success message
  console.log("Email sent successfully:", result);
}).catch(error => {
  // Log error message
  console.error("Error sending email:", error);
});
