package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

@Service
public class IpGeoLocationService {

    private DatabaseReader dbReader;

    @PostConstruct
    public void init() {

        try {

            InputStream dbStream = getClass()
                    .getResourceAsStream("/geoip/GeoLite2-City.mmdb");

            if (dbStream == null) {
                throw new RuntimeException(
                        "GeoLite2 database file not found"
                );
            }

            dbReader = new DatabaseReader.Builder(dbStream)
                    .build();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to initialize GeoIP database",
                    e
            );
        }
    }

    public Map<String, String> lookup(String ip) {

        Map<String, String> result = new HashMap<>();

        try {

            // LOCALHOST SPECIAL CASE
            if (
                    ip.equals("127.0.0.1")
                            || ip.equals("0:0:0:0:0:0:0:1")
                            || ip.equals("localhost")
            ) {

                result.put("country", "LOCAL");
                result.put("city", "Development");

                return result;
            }

            InetAddress ipAddress =
                    InetAddress.getByName(ip);

            CityResponse response =
                    dbReader.city(ipAddress);

            String country =
                    response.getCountry().getIsoCode();

            String city =
                    response.getCity().getName();

            result.put(
                    "country",
                    country != null ? country : "Unknown"
            );

            result.put(
                    "city",
                    city != null ? city : "Unknown"
            );

            return result;

        } catch (Exception e) {

            result.put("country", "Unknown");
            result.put("city", "Unknown");

            return result;
        }
    }
}