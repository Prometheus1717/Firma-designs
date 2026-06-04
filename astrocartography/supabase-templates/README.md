# Supabase Email Templates — NatalNavigator

All five branded templates ready to paste into the Supabase Dashboard.
Custom SMTP via Resend is already configured, so emails will come from
`info@natalnavigator.com` with these designs.

## Where to paste

**Supabase Dashboard → Authentication → Email Templates**

| File | Dashboard tab | Subject line |
| --- | --- | --- |
| `confirm-signup.html` | **Confirm signup** | `Verify your NatalNavigator email` |
| `reset-password.html` | **Reset Password** | `Reset your NatalNavigator password` |
| `magic-link.html` | **Magic Link** | `Your NatalNavigator sign-in link` |
| `email-change.html` | **Change Email Address** | `Confirm your new NatalNavigator email` |
| `reauthentication.html` | **Reauthentication** | `NatalNavigator security code` |

For each tab:

1. Open the tab in the dashboard.
2. Copy the entire HTML content of the matching file.
3. Paste into the "Message body" editor (replace the existing content).
4. Set the "Subject" field to the value from the table above.
5. Click **Save changes**.

## What variables the templates use

| Template | Variables |
| --- | --- |
| Confirm signup | `{{ .ConfirmationURL }}` |
| Reset Password | `{{ .ConfirmationURL }}` |
| Magic Link | `{{ .ConfirmationURL }}` |
| Change Email Address | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |
| Reauthentication | `{{ .Token }}` (6-digit code, NOT a URL) |

## Verifying after paste

Send a test reset-password request to your own address from the
production site. The mail should arrive within ~20 s, come from
`info@natalnavigator.com`, render dark with the NatalNavigator green
button, and the link should land on `/reset-password` of the
production site.
