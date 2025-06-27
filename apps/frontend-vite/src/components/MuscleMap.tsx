import React from 'react';
import styles from './MuscleMap.module.css';

type HighlightLevel = 0 | 1 | 2;

interface MuscleMapProps {
  gender: 'male' | 'female';
  highlightedParts: {
    chest: HighlightLevel;
    back: HighlightLevel;
    legs: HighlightLevel;
    shoulders: HighlightLevel;
    arms: HighlightLevel;
    abs: HighlightLevel;
    full_body: HighlightLevel;
  };
}

const COLOR_MAP = {
  0: 'transparent',
  1: 'rgba(0, 200, 0, 0.5)',   // 목표 이하: 초록
  2: 'rgba(255, 0, 0, 0.6)',   // 목표 이상: 빨강
};

const MuscleMap: React.FC<MuscleMapProps> = ({ gender, highlightedParts }) => {
  const renderBodyPart = (part: keyof typeof highlightedParts, className: string) => (
    <div
      className={`${styles.overlay} ${styles[className]}`}
      style={{ backgroundColor: COLOR_MAP[highlightedParts[part]] }}
    />
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.human}>
        <img
          src={`/images/muscle/${gender}_front.png`}
          alt={`${gender} front`}
          className={styles.base}
        />
        {renderBodyPart('chest', 'chest')}
        {renderBodyPart('shoulders', 'shoulders')}
        {renderBodyPart('arms', 'arms')}
        {renderBodyPart('abs', 'abs')}
        {renderBodyPart('legs', 'legs')}
        {highlightedParts.full_body > 0 && (
          <div
            className={`${styles.overlay} ${styles.fullBodyAura}`}
            style={{ backgroundColor: COLOR_MAP[highlightedParts.full_body] }}
          />
        )}
      </div>

      <div className={styles.human}>
        <img
          src={`/images/muscle/${gender}_back.png`}
          alt={`${gender} back`}
          className={styles.base}
        />
        {renderBodyPart('back', 'back')}
        {renderBodyPart('shoulders', 'shoulders')}
        {renderBodyPart('arms', 'arms')}
        {renderBodyPart('legs', 'legs')}
        {highlightedParts.full_body > 0 && (
          <div
            className={`${styles.overlay} ${styles.fullBodyAura}`}
            style={{ backgroundColor: COLOR_MAP[highlightedParts.full_body] }}
          />
        )}
      </div>
    </div>
  );
};

export default MuscleMap;
