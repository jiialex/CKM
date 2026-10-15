package org.insa.pki.certificatemanagement.certificateManagmentBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.security.Provider;
import java.security.Security;
@EnableScheduling
@SpringBootApplication
public class Application {

	public static void main(String[] args) {

		try {

			System.setProperty("SOFTHSM2_CONF", "C:/SoftHSM2/etc/softhsm2.conf");

			String config = "--name=SoftHSM\n" +
					"library=C:/SoftHSM2/lib/softhsm2-x64.dll\n" +
					"slotListIndex=0";

			Provider p = Security.getProvider("SunPKCS11");
			if (p != null) {
				p = p.configure(config);
				Security.addProvider(p);
				System.out.println("HSM Provider (SoftHSM x64) registered successfully!");
			}
		} catch (Exception e) {
			System.err.println("HSM initialization failed: " + e.getMessage());
			e.printStackTrace();
		}

		SpringApplication.run(Application.class, args);
	}
}