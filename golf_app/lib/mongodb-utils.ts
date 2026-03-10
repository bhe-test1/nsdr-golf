export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export function isUUID(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

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

