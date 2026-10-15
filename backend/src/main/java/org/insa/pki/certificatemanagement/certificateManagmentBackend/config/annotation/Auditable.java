package org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {



    String action();

    String resource() default "";

    Level level() default Level.MEDIUM;

    boolean maskSensitiveData() default false; //controls whether sensitive information should be masked in the audit information.


    boolean async() default false; //indicates whether auditing should be performed asynchronously.

    boolean includeRequestBody() default true; //specifies whether the audit information should include the request body.

    boolean includeResponse() default false;


    String complianceTag() default "";

    String[] tags() default {};//s allows multiple tags.


    String[] metadata() default {};//provides another collection of additional information.

    enum Level {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}