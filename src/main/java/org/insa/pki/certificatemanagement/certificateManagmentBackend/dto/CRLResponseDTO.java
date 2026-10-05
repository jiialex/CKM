package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.util.Arrays;
import java.util.Objects;

public class CRLResponseDTO {
    private final byte[] crlData;
    private final String format;

    public CRLResponseDTO(byte[] crlData, String format) {
        this.crlData = Arrays.copyOf(Objects.requireNonNull(crlData, "crlData"), crlData.length);
        this.format = Objects.requireNonNull(format, "format");
    }

    public byte[] getCrlData() {
        return Arrays.copyOf(crlData, crlData.length);
    }

    public String getFormat() {
        return format;
    }
}
