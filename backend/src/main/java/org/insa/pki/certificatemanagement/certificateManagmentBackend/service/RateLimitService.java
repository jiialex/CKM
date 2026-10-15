package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
public class RateLimitService {

    private final StringRedisTemplate redis;

    private static final int MAX_FAILS = 5;

    private static final Duration WINDOW =
            Duration.ofMinutes(10);

    private static final Duration BLOCK_DURATION =
            Duration.ofMinutes(30);

    public RateLimitService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    private String failKey(String key) {
        return "security:fail:" + key;
    }

    private String blockKey(String key) {
        return "security:block:" + key;
    }

    public boolean isAllowed(String key) {

        String blocked = redis.opsForValue()
                .get(blockKey(key));

        return blocked == null;
    }

    public void loginFailed(String key) {

        String failKey = failKey(key);

        Long fails = redis.opsForValue()
                .increment(failKey);

        if (fails != null && fails == 1) {
            redis.expire(failKey, WINDOW);
        }

        if (fails != null && fails >= MAX_FAILS) {

            redis.opsForValue().set(
                    blockKey(key),
                    "BLOCKED",
                    BLOCK_DURATION
            );

            redis.delete(failKey);
        }
    }

    public void loginSucceeded(String key) {

        redis.delete(failKey(key));
        redis.delete(blockKey(key));
    }

    public void clearAllForIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return;
        }

        Set<String> keys = redis.keys("security:*:" + ip + "*");

        if (keys != null && !keys.isEmpty()) {
            redis.delete(keys);
        }
    }

    public long getRemainingBlockSeconds(String key) {

        Long seconds =
                redis.getExpire(blockKey(key));

        if (seconds == null || seconds < 0) {
            return 0;
        }

        return seconds;
    }

    public Duration getBlockDuration() {
        return BLOCK_DURATION;
    }
}
