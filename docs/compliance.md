# Record safeguards and local review rules

Checked 7 November 2026. These checks inspect the records supplied by the operator. They do not certify legal compliance or replace a lawyer's decisions.

| Rule | What the command checks | Authority and limits |
|---|---|---|
| IPP5 | Matter access_review_on is present and has not passed | [NZ Privacy Commissioner, principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards. A review date is our operational reminder, not a statutory interval or proof that access is secure. |
| IPP9 | Matter purpose is recorded and retention_review_on is current | [NZ Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to lawful purposes. This is a review prompt, never automatic deletion; litigation holds and other retention duties require human judgment. |
| LOCAL-CITATION | Supporting citation exists at the current fact/source revisions | Internal evidence quality rule, not a court rule. No claim about authenticity or admissibility. |
| LOCAL-PRIVILEGE | Source confidentiality has been reviewed | Internal disclosure preparation rule. Software cannot determine privilege. Every generated document remains internal, even when this check clears. |

The demo has overdue reviews and an unreviewed source. Configure review dates for your practice; no legal deadline is calculated. Australian users must have their adviser map local duties before relying on these NZ review prompts.

The application does not implement court filing, trust accounting, payroll, payments, medical advice or evidence discovery services. The operator keeps responsibility for source documents, jurisdiction, privilege, disclosure and legal conclusions. It is a fact register, not a compliance service.

Database row security is enabled with no public policies. Use a trusted database owner connection. An owner can read every matter and alter history. Generated files are private on supported filesystems and ignored by Git, but your operating system permissions, backups, staff practices and approved agent data handling still govern confidentiality.
