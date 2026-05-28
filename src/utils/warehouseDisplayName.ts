/** 库房展示名：去掉末尾括号及括号内内容（如「河北诚彻…（624）」→「河北诚彻…」） */
export function warehouseDisplayName(name: string | null | undefined): string {
  const s = String(name ?? '').trim()
  if (!s) return ''
  return s.replace(/[（(][^）)]*[）)]\s*$/u, '').trim()
}
