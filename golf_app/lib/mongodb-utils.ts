/**
 * MongoDB ObjectID 형식 검증 및 변환 유틸리티
 */

/**
 * 문자열이 유효한 MongoDB ObjectID 형식인지 확인
 * ObjectID는 24자리 16진수 문자열이어야 함
 */
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  // ObjectID는 정확히 24자리 16진수 문자열
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * UUID 형식인지 확인
 */
export function isUUID(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  // UUID 형식: 8-4-4-4-12 (하이픈 포함)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * ID가 유효한 ObjectID 형식인지 확인하고, 그렇지 않으면 에러 메시지 반환
 */
export function validateObjectId(id: string, fieldName: string = 'ID'): { valid: boolean; error?: string } {
  if (!id) {
    return { valid: false, error: `${fieldName}가 제공되지 않았습니다.` }
  }

  if (isUUID(id)) {
    return {
      valid: false,
      error: `${fieldName}가 UUID 형식입니다. MongoDB는 ObjectID 형식(24자리 16진수)을 사용합니다.`,
    }
  }

  if (!isValidObjectId(id)) {
    return {
      valid: false,
      error: `${fieldName}가 유효한 ObjectID 형식이 아닙니다. ObjectID는 24자리 16진수 문자열이어야 합니다.`,
    }
  }

  return { valid: true }
}

