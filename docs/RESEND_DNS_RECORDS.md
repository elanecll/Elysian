# Resend sending-domain verification — verified

Domain: `notifications.elysianbeautyspa.co.uk`  
Resend region: Ireland (`eu-west-1`)  
Resend domain ID: `9fdaa843-a65c-48d3-ada3-439282603550`  
DNS provider: LCN

These are public DNS records, not API secrets. Add them in the LCN zone for
`elysianbeautyspa.co.uk` using the relative names below, with the provider's default
TTL. Check for an existing record at each name first; do not replace unrelated
website, forwarding, SPF or MX records.

| Type  | Name relative to elysianbeautyspa.co.uk | Value                                                                                                                                                                                                                        |
| ----- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TXT   | `resend._domainkey.notifications`       | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKm9doWcuqIZuJIb08Roh+SlTtGtkcKnKuTmVHgeLoamrtHNtMsV+nQ8Os2FpWtcz72BPrJVjGLqvLpRP0mY0mCUC05aw02at9Iw2puiEMb6gllQJvFWw7/L2qnIkxzCXtQvVJf018uYArJJ4ZRE9OrOBpCpa7bp+sjO+EJj5PfQIDAQAB` |
| CNAME | `rsend.notifications`                   | `rsend-euw1.forge.rmta.net`                                                                                                                                                                                                  |
| CNAME | `send.notifications`                    | `send.forge.rmta.net`                                                                                                                                                                                                        |
| TXT   | `_dmarc.notifications`                  | `v=DMARC1; p=none;`                                                                                                                                                                                                          |

The DKIM and two CNAME records were supplied by Resend's domain setup screen on
23 October 2026. The monitor-only DMARC record applies to this sending subdomain.
The four records were approved and saved in LCN on 23 October 2026 (TTL 86400).
Authoritative DNS returned all four values, and Resend confirmed **verified**.

Adding them authorizes Resend to authenticate mail for this subdomain. Receiving
is disabled. Sender: `Elysian Beauty Spa <bookings@notifications.elysianbeautyspa.co.uk>`.
Replies should go to `elainecll@hotmail.com`.

Existing root/www, forwarding, SPF and MX records were preserved.
The production sending key is domain-restricted and is stored only in Vercel secrets.
