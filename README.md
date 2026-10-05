Project Setup Instruction 

All developers must follow the standard package structure and Maven configuration for the certificate-management-backend project.

1. Base Package Structure (Mandatory)

	Use the following base package:

	org.insa.pki.certificatemanagement

2. Create the required sub-packages exactly as defined:

org.insa.pki.certificatemanagement
    ├── controller
    ├── service
    ├── repository
    ├── model
    ├── dto
    ├── security
    ├── config

3. Package Responsibilities

	controller → REST APIs (HTTP endpoints)

	service → Business logic implementation

	repository → Database access (JPA repositories)

	model → Entity classes (database models)

	dto → Data Transfer Objects (request/response)

	security → Authentication, authorization, RBAC

	config → Application configuration (Spring configs)

4. Maven Configuration (Required)

Update your pom.xml to use the following:

<groupId>org.insa.pki</groupId>
<artifactId>certificate-management-backend</artifactId>
<version>0.0.1-SNAPSHOT</version>
<name>certificate-management-backend</name>