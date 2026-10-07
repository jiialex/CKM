# Cryptographic Credential Vault Integration Guide

### 1. Authentication & Token Handshakes
All communications with system nodes require a signed asymmetric signature matrix. Mutual TLS (mTLS) handshakes must be established before executing token verification pipelines. Both client and server endpoints must exchange valid X.509 certificates chained up to a trusted root authority.

Once the transport layer is secured, clients authenticate payload streams by passing a cryptographically signed JSON Web Token (JWT) or an ephemeral node access token inside the authorization header:

```http
Authorization: Bearer KV_TOKEN_SHA256_[HEX_STREAM]
Lifecycle Phase,State Description,Permitted Operations,Target Lifetime
Active,Key is freshly generated and fully operational.,Encryption and Decryption,90 Days
Deprecated,Key is superseded by a newly rotated generation block.,Decryption Only (Legacy Read),180 Days
Archived,Key is completely unlinked from active nodes.,Restricted Emergency Recovery,365 Days
Destroyed,Key material is securely erased via zeroization.,None (Purged from HSM),Permanent