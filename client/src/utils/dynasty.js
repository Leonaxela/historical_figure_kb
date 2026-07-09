/**
 * his_id 前缀 → 朝代名称 映射
 */
export const dynastyMap = {
  chunqiu: '春秋',
  zhanguo: '战国',
  qin: '秦',
  xihan: '西汉',
  donghan: '东汉',
  sanguo: '三国',
  xijin: '西晋',
  dongjin: '东晋',
  nanbei: '南北朝',
  sui: '隋',
  tang: '唐',
  beisong: '北宋',
  nansong: '南宋',
  yuan: '元',
  ming: '明',
  qing: '清',
}

/**
 * 根据 his_id 和 nationality 返回展示用的朝代/国籍
 * 中国人物 → 显示朝代名（如"北宋"），外国人 → 显示国籍原值
 */
export function displayNationality(celebrity) {
  if (!celebrity) return ''
  const prefix = celebrity.his_id?.split('_')[0]
  if (prefix && dynastyMap[prefix]) return dynastyMap[prefix]
  return celebrity.nationality || ''
}
