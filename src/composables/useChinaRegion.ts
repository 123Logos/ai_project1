import { ref, shallowRef } from 'vue'

type PcaNode = { code: string; name: string; children?: PcaNode[] }
type CityRow = { code: string; name: string; provinceCode: string }

const MUNICIPALITIES = new Set(['北京市', '上海市', '天津市', '重庆市'])

const FALLBACK_PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省',
  '重庆市', '四川省', '贵州省', '云南省', '西藏自治区',
  '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  '台湾省', '香港特别行政区', '澳门特别行政区',
]

let loadPromise: Promise<void> | null = null

const ready = ref(false)
const loadError = ref('')
const provinceNames = shallowRef<string[]>([...FALLBACK_PROVINCES])
const provinceCodeByName = shallowRef<Map<string, string>>(new Map())
const cityRows = shallowRef<CityRow[]>([])
const pcaRoots = shallowRef<PcaNode[]>([])

function regionAssetUrl(rel: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${rel.replace(/^\//, '')}`
}

function districtsUnderProvince(root: PcaNode): string[] {
  const out: string[] = []
  for (const pref of root.children ?? []) {
    for (const leaf of pref.children ?? []) {
      if (leaf.name) out.push(leaf.name)
    }
  }
  return out
}

function buildCitiesInProvince(provinceName: string): string[] {
  const code = provinceCodeByName.value.get(provinceName)
  if (!code) return []
  const fromFile = cityRows.value.filter((c) => c.provinceCode === code).map((c) => c.name)
  const uniq = new Set<string>(fromFile)
  if (MUNICIPALITIES.has(provinceName)) {
    uniq.add(provinceName)
    const root = pcaRoots.value.find((p) => p.name === provinceName)
    if (root) for (const d of districtsUnderProvince(root)) uniq.add(d)
  }
  return [...uniq].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function buildAllCityNames(): string[] {
  const uniq = new Set<string>()
  for (const c of cityRows.value) uniq.add(c.name)
  for (const m of MUNICIPALITIES) uniq.add(m)
  return [...uniq].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

async function loadOnce(): Promise<void> {
  if (ready.value) return
  const [pcaRes, cityRes] = await Promise.all([
    fetch(regionAssetUrl('region/p-c-a.json')),
    fetch(regionAssetUrl('region/city.json')),
  ])
  if (!pcaRes.ok) throw new Error(`加载省市区数据失败（${pcaRes.status}）`)
  if (!cityRes.ok) throw new Error(`加载城市数据失败（${cityRes.status}）`)
  const pca = (await pcaRes.json()) as PcaNode[]
  const cities = (await cityRes.json()) as CityRow[]
  if (!Array.isArray(pca) || !Array.isArray(cities)) throw new Error('省市区数据格式无效')

  pcaRoots.value = pca
  cityRows.value = cities

  const map = new Map<string, string>()
  const names: string[] = []
  for (const n of pca) {
    if (n.name && n.code) {
      map.set(n.name, n.code)
      names.push(n.name)
    }
  }
  names.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  provinceCodeByName.value = map
  provinceNames.value = names.length ? names : [...FALLBACK_PROVINCES]
  ready.value = true
}

export function useChinaRegion() {
  async function ensureLoaded(): Promise<void> {
    if (ready.value) return
    if (!loadPromise) {
      loadPromise = (async () => {
        try {
          await loadOnce()
          loadError.value = ''
        } catch (e) {
          loadError.value = e instanceof Error ? e.message : String(e)
          provinceNames.value = [...FALLBACK_PROVINCES]
          ready.value = false
          loadPromise = null
        }
      })()
    }
    await loadPromise
  }

  return {
    ready,
    loadError,
    provinceNames,
    ensureLoaded,
    citiesInProvince: buildCitiesInProvince,
    allCityNames: buildAllCityNames,
  }
}
