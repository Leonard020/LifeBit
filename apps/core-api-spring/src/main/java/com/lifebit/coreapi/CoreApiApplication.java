package com.lifebit.coreapi; // <-- 정확히 일치해야 합니다.

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // <-- 이 어노테이션이 있어야 합니다.
public class CoreApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoreApiApplication.class, args);
    }
}