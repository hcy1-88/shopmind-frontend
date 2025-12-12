<template>
  <div class="address-selector">
    <el-form-item label="所在地区" prop="regionCodes">
      <el-cascader
        v-model="regionCodes"
        :options="regionOptions"
        :props="cascaderProps"
        placeholder="请选择省/市/区"
        style="width: 100%"
        @change="handleRegionChange"
      />
    </el-form-item>

    <el-form-item label="详细地址" prop="detailAddress">
      <el-input
        v-model="detailAddress"
        placeholder="街道、门牌号等"
        :maxlength="200"
        show-word-limit
        type="textarea"
        :rows="3"
        @input="handleDetailChange"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import pcaData from '@/assets/pca-code.json'

interface RegionNode {
  code: string
  name: string
  children?: RegionNode[]
}

interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
}

interface Props {
  modelValue?: {
    regionCodes: [string, string, string]
    detailAddress: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: { regionCodes: [string, string, string]; detailAddress: string; provinceCode: string; provinceName: string; cityCode: string; cityName: string; districtCode: string; districtName: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const regionOptions = ref<CascaderOption[]>([])
const regionCodes = ref<[string, string, string]>(props.modelValue?.regionCodes || ['', '', ''])
const detailAddress = ref(props.modelValue?.detailAddress || '')

const cascaderProps = {
  checkStrictly: false,
}

// 转换数据格式为 Element Plus Cascader 所需格式
const convertToOptions = (data: RegionNode[]): CascaderOption[] => {
  return data.map((item) => ({
    value: item.code,
    label: item.name,
    children: item.children ? convertToOptions(item.children) : undefined,
  }))
}

// 根据 code 查找地区名称
const findRegionName = (code: string, data: RegionNode[]): string => {
  for (const item of data) {
    if (item.code === code) {
      return item.name
    }
    if (item.children) {
      const found = findRegionName(code, item.children)
      if (found) return found
    }
  }
  return ''
}

// 初始化数据
onMounted(() => {
  regionOptions.value = convertToOptions(pcaData as unknown as RegionNode[])
})

// 监听外部变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      regionCodes.value = newVal.regionCodes
      detailAddress.value = newVal.detailAddress
    }
  },
  { deep: true }
)

// 地区选择变化
const handleRegionChange = (value: string[]) => {
  if (value && value.length === 3) {
    const [provinceCode, cityCode, districtCode] = value as [string, string, string]

    const provinceName = findRegionName(provinceCode, pcaData as unknown as RegionNode[])
    const cityName = findRegionName(cityCode, pcaData as unknown as RegionNode[])
    const districtName = findRegionName(districtCode, pcaData as unknown as RegionNode[])

    emit('update:modelValue', {
      regionCodes: [provinceCode, cityCode, districtCode],
      detailAddress: detailAddress.value,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      districtCode,
      districtName,
    })
  }
}

// 详细地址变化
const handleDetailChange = () => {
  if (regionCodes.value && regionCodes.value.length === 3 && regionCodes.value[0]) {
    const [provinceCode, cityCode, districtCode] = regionCodes.value

    const provinceName = findRegionName(provinceCode, pcaData as unknown as RegionNode[])
    const cityName = findRegionName(cityCode, pcaData as unknown as RegionNode[])
    const districtName = findRegionName(districtCode, pcaData as unknown as RegionNode[])

    emit('update:modelValue', {
      regionCodes: [provinceCode, cityCode, districtCode],
      detailAddress: detailAddress.value,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      districtCode,
      districtName,
    })
  }
}
</script>

<style scoped>
.address-selector {
  width: 100%;
}
</style>
