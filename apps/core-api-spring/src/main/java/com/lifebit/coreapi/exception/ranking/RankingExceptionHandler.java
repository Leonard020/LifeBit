package com.lifebit.coreapi.exception.ranking;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class RankingExceptionHandler {

    @ExceptionHandler(RankingNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRankingNotFoundException(RankingNotFoundException e) {
        log.error("랭킹을 찾을 수 없습니다: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
    }

    @ExceptionHandler(RankingRewardException.class)
    public ResponseEntity<ErrorResponse> handleRankingRewardException(RankingRewardException e) {
        log.error("랭킹 보상 처리 중 오류 발생: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
    }

    @ExceptionHandler(RankingNotificationException.class)
    public ResponseEntity<ErrorResponse> handleRankingNotificationException(RankingNotificationException e) {
        log.error("랭킹 알림 처리 중 오류 발생: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
    }

    @ExceptionHandler(RankingException.class)
    public ResponseEntity<ErrorResponse> handleRankingException(RankingException e) {
        log.error("랭킹 시스템 오류 발생: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage()));
    }

    private record ErrorResponse(int status, String message) {}
} 