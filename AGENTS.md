<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep mobile accessibility presentation in the shared `.escudo-app` CSS scope, with composer/header layout utilities in the chat; this keeps secondary screens and overlays consistent without changing conversation logic.
- Use separate content routes for the main menu, protection, education and credit portfolio; reuse the existing chat with independent mounted conversation state to keep module navigation explicit and prevent mixed histories.
- Keep credit guidance informational until verified product conditions and an application channel are supplied; never invent terms or imply that browsing submits an application.
