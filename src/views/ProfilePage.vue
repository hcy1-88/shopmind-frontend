<template>
  <div class="profile-page">
    <div class="header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <span class="header-title">个人中心</span>
    </div>

    <div class="content">
      <el-card class="user-card">
        <div class="user-info">
          <el-avatar :size="80" :src="userStore.user?.avatar" :icon="User" />
          <div class="user-details">
            <h3>{{ userStore.user?.nickname || userStore.user?.phoneNumber || '未设置昵称' }}</h3>
            <p v-if="userStore.user?.phoneNumber">{{ userStore.user?.phoneNumber }}</p>
            <div class="user-meta">
              <span v-if="userStore.user?.gender">{{ getGenderText(userStore.user.gender) }}</span>
              <span v-if="userStore.user?.age">{{ userStore.user.age }}岁</span>
            </div>
          </div>
          <el-button type="primary" :icon="Edit" @click="showProfileDialog = true">
            编辑资料
          </el-button>
        </div>
      </el-card>

      <el-card class="preferences-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#7c3aed"><Setting /></el-icon>
            <span>我的购物偏好</span>
          </div>
        </template>

        <el-form ref="formRef" :model="preferences" label-width="100px" class="preferences-form">
          <el-form-item label="兴趣标签">
            <div v-if="loadingInterests" class="loading-interests">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <el-checkbox-group v-else v-model="preferences.interests" class="interests-group">
              <div v-for="interest in enabledInterests" :key="interest.code" class="interest-item">
                <el-checkbox :label="interest.code" :value="interest.code">
                  <span class="interest-content">
                    <span class="interest-icon">{{ interest.icon }}</span>
                    <span class="interest-name">{{ interest.name }}</span>
                  </span>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </el-form-item>

          <!-- TODO: 语言偏好功能暂时不做，国际化有点麻烦，以后再说，可能砍掉 -->
          <!-- <el-form-item label="语言偏好">
            <el-radio-group v-model="preferences.language">
              <el-radio label="zh">中文</el-radio>
              <el-radio label="en">English</el-radio>
            </el-radio-group>
          </el-form-item> -->

          <el-form-item>
            <el-button type="primary" @click="savePreferences" :loading="saving"
              >保存偏好</el-button
            >
          </el-form-item>
        </el-form>

        <el-alert type="info" :closable="false" show-icon>
          <template #title>你的偏好将用于 AI 推荐和商品问答个性化</template>
        </el-alert>
      </el-card>

      <el-card class="address-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#7c3aed"><Location /></el-icon>
            <span>收货地址管理</span>
            <el-button
              type="primary"
              size="small"
              style="margin-left: auto"
              @click="showAddressDialog = true"
            >
              新增地址
            </el-button>
          </div>
        </template>

        <div class="address-list">
          <el-empty v-if="userStore.addresses.length === 0" description="暂无收货地址" />
          <div v-for="address in userStore.addresses" :key="address.id" class="address-item">
            <div class="address-content">
              <div class="address-header">
                <el-tag :type="getLabelType(address.label)" size="small">{{
                  address.label
                }}</el-tag>
                <el-tag v-if="address.isDefault" type="success" size="small">默认</el-tag>
              </div>
              <div class="address-detail">
                <p class="address-region">
                  {{ address.provinceName }} {{ address.cityName }} {{ address.districtName }}
                </p>
                <p class="address-full">{{ address.detailAddress }}</p>
                <p v-if="address.contactName || address.contactPhone" class="address-contact">
                  <span v-if="address.contactName">{{ address.contactName }}</span>
                  <span v-if="address.contactPhone">{{ address.contactPhone }}</span>
                </p>
              </div>
            </div>
            <div class="address-actions">
              <el-button
                v-if="!address.isDefault"
                size="small"
                @click="handleSetDefault(address.id!)"
              >
                设为默认
              </el-button>
              <el-button size="small" @click="handleEditAddress(address)">编辑</el-button>
              <el-popconfirm
                title="确定要删除这个地址吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDeleteAddress(address.id!)"
              >
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="orders-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#7c3aed"><Document /></el-icon>
            <span>我的订单</span>
          </div>
        </template>

        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="待付款" name="pending_payment">
            <div class="order-list">
              <el-empty v-if="!orderLoading && orders.length === 0" description="暂无订单" />
              <div v-loading="orderLoading">
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <el-tag type="warning">{{ getStatusText(order.status) }}</el-tag>
                  </div>
                  <div class="order-body">
                    <div class="order-main-info">
                      <div class="order-info-item">
                        <span class="label">订单金额：</span>
                        <span class="value amount">¥{{ order.totalAmount }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">商品数量：</span>
                        <span class="value">{{ order.items?.length || 0 }} 件</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ order.createdAt }}</span>
                      </div>
                      <div v-if="order.shippingContact" class="order-info-item">
                        <span class="label">收货人：</span>
                        <span class="value">{{ order.shippingContact }}</span>
                      </div>
                      <div v-if="order.shippingPhone" class="order-info-item">
                        <span class="label">联系电话：</span>
                        <span class="value">{{ order.shippingPhone }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="goToDetail(order)">查看详情</el-button>
                    <el-button size="small" type="primary" @click="handleConsult(order.id)">
                      <el-icon><ChatDotRound /></el-icon>
                      咨询订单
                    </el-button>
                  </div>
                </div>
              </div>
              <el-pagination
                v-if="orderTotal > 0"
                v-model:current-page="orderPageNumber"
                v-model:page-size="orderPageSize"
                :total="orderTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadOrders()"
                @current-change="loadOrders()"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="待发货" name="pending_shipment">
            <div class="order-list">
              <el-empty v-if="!orderLoading && orders.length === 0" description="暂无订单" />
              <div v-loading="orderLoading">
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <el-tag type="warning">{{ getStatusText(order.status) }}</el-tag>
                  </div>
                  <div class="order-body">
                    <div class="order-main-info">
                      <div class="order-info-item">
                        <span class="label">订单金额：</span>
                        <span class="value amount">¥{{ order.totalAmount }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">商品数量：</span>
                        <span class="value">{{ order.items?.length || 0 }} 件</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ order.createdAt }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="goToDetail(order)">查看详情</el-button>
                    <el-button size="small" type="primary" @click="handleConsult(order.id)">
                      <el-icon><ChatDotRound /></el-icon>
                      咨询订单
                    </el-button>
                  </div>
                </div>
              </div>
              <el-pagination
                v-if="orderTotal > 0"
                v-model:current-page="orderPageNumber"
                v-model:page-size="orderPageSize"
                :total="orderTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadOrders()"
                @current-change="loadOrders()"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="待收货" name="pending_receipt">
            <div class="order-list">
              <el-empty v-if="!orderLoading && orders.length === 0" description="暂无订单" />
              <div v-loading="orderLoading">
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <el-tag type="warning">{{ getStatusText(order.status) }}</el-tag>
                  </div>
                  <div class="order-body">
                    <div class="order-main-info">
                      <div class="order-info-item">
                        <span class="label">订单金额：</span>
                        <span class="value amount">¥{{ order.totalAmount }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">商品数量：</span>
                        <span class="value">{{ order.items?.length || 0 }} 件</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ order.createdAt }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="goToDetail(order)">查看详情</el-button>
                    <el-button size="small" type="primary" @click="handleConsult(order.id)">
                      <el-icon><ChatDotRound /></el-icon>
                      咨询订单
                    </el-button>
                  </div>
                </div>
              </div>
              <el-pagination
                v-if="orderTotal > 0"
                v-model:current-page="orderPageNumber"
                v-model:page-size="orderPageSize"
                :total="orderTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadOrders()"
                @current-change="loadOrders()"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="待评价" name="pending_review">
            <div class="order-list">
              <el-empty v-if="!orderLoading && orders.length === 0" description="暂无订单" />
              <div v-loading="orderLoading">
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <el-tag type="warning">{{ getStatusText(order.status) }}</el-tag>
                  </div>
                  <div class="order-body">
                    <div class="order-main-info">
                      <div class="order-info-item">
                        <span class="label">订单金额：</span>
                        <span class="value amount">¥{{ order.totalAmount }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">商品数量：</span>
                        <span class="value">{{ order.items?.length || 0 }} 件</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ order.createdAt }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="goToDetail(order)">查看详情</el-button>
                    <el-button size="small" type="primary" @click="handleConsult(order.id)">
                      <el-icon><ChatDotRound /></el-icon>
                      咨询订单
                    </el-button>
                  </div>
                </div>
              </div>
              <el-pagination
                v-if="orderTotal > 0"
                v-model:current-page="orderPageNumber"
                v-model:page-size="orderPageSize"
                :total="orderTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadOrders()"
                @current-change="loadOrders()"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="退款/售后" name="refund">
            <div class="order-list">
              <el-empty v-if="!orderLoading && orders.length === 0" description="暂无订单" />
              <div v-loading="orderLoading">
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <el-tag type="danger">{{ getStatusText(order.status) }}</el-tag>
                  </div>
                  <div class="order-body">
                    <div class="order-main-info">
                      <div class="order-info-item">
                        <span class="label">订单金额：</span>
                        <span class="value amount">¥{{ order.totalAmount }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">商品数量：</span>
                        <span class="value">{{ order.items?.length || 0 }} 件</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ order.createdAt }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="goToDetail(order)">查看详情</el-button>
                    <el-button size="small" type="primary" @click="handleConsult(order.id)">
                      <el-icon><ChatDotRound /></el-icon>
                      咨询订单
                    </el-button>
                  </div>
                </div>
              </div>
              <el-pagination
                v-if="orderTotal > 0"
                v-model:current-page="orderPageNumber"
                v-model:page-size="orderPageSize"
                :total="orderTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadOrders()"
                @current-change="loadOrders()"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 地址编辑弹窗 -->
    <el-dialog
      v-model="showAddressDialog"
      :title="editingAddress ? '编辑地址' : '新增地址'"
      width="600px"
      @close="handleCloseAddressDialog"
    >
      <el-form ref="addressFormRef" :model="addressForm" :rules="addressRules" label-width="100px">
        <el-form-item label="地址标签" prop="label">
          <el-radio-group v-model="addressForm.label">
            <el-radio label="家庭">家庭</el-radio>
            <el-radio label="公司">公司</el-radio>
            <el-radio label="学校">学校</el-radio>
            <el-radio label="其他">其他</el-radio>
          </el-radio-group>
        </el-form-item>

        <AddressSelector v-model="addressData" />

        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="addressForm.contactName" placeholder="收货人姓名（选填）" />
        </el-form-item>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="addressForm.contactPhone" placeholder="收货人电话（选填）" />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="primary" :loading="addressSaving" @click="handleSaveAddress">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑资料弹窗 -->
    <el-dialog
      v-model="showProfileDialog"
      title="编辑资料"
      width="600px"
      @close="handleCloseProfileDialog"
    >
      <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="handleAvatarUpload"
            accept="image/*"
          >
            <el-avatar v-if="profileForm.avatar" :size="100" :src="profileForm.avatar" />
            <el-avatar v-else :size="100" :icon="User" />
            <div class="avatar-upload-hint">点击上传头像</div>
          </el-upload>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="profileForm.nickname" placeholder="请输入昵称" maxlength="50" />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="profileForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
            <el-radio label="other">其他</el-radio>
            <el-radio label="secret">保密</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="年龄">
          <el-input-number v-model="profileForm.age" :min="1" :max="150" placeholder="请输入年龄" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showProfileDialog = false">取消</el-button>
        <el-button type="primary" :loading="profileSaving" @click="handleSaveProfile">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="showOrderDetailDialog"
      title="订单详情"
      width="800px"
      @close="viewingOrder = null"
    >
      <div v-if="viewingOrder" class="order-detail-dialog">
        <!-- 订单主信息 -->
        <el-descriptions :column="2" border title="订单信息">
          <el-descriptions-item label="订单号">{{ viewingOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusTagType(viewingOrder.status)">
              {{ getStatusText(viewingOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="amount">¥{{ viewingOrder.totalAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ viewingOrder.createdAt }}</el-descriptions-item>
        </el-descriptions>

        <!-- 收货信息 -->
        <el-descriptions
          v-if="viewingOrder.shippingContact"
          :column="2"
          border
          title="收货信息"
          style="margin-top: 20px"
        >
          <el-descriptions-item label="收货人">{{
            viewingOrder.shippingContact
          }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{
            viewingOrder.shippingPhone
          }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ viewingOrder.shippingProvince }} {{ viewingOrder.shippingCity }}
            {{ viewingOrder.shippingDistrict }} {{ viewingOrder.shippingDetail }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 订单明细 -->
        <div class="order-items-section" style="margin-top: 20px">
          <h4>订单明细</h4>
          <el-table :data="viewingOrder.items" border style="width: 100%">
            <el-table-column label="商品图片" width="100">
              <template #default="{ row }">
                <el-image :src="row.productImage" fit="cover" style="width: 60px; height: 60px" />
              </template>
            </el-table-column>
            <el-table-column label="商品名称" prop="productName" />
            <el-table-column label="单价" width="120">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="数量" width="80" prop="quantity" />
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ row.subtotal }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="showOrderDetailDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  Setting,
  Document,
  ChatDotRound,
  Location,
  Edit,
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import AddressSelector from '@/components/AddressSelector.vue'
import { userApi } from '@/api/user-api'
import type {
  UserPreferences,
  Order,
  OrderStatus,
  Address,
  AddressFormData,
  UpdateProfileForm,
  InterestDto,
} from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref<OrderStatus>('pending_payment')
const orders = ref<Order[]>([])
const saving = ref(false)

// 订单分页相关
const orderPageNumber = ref(1)
const orderPageSize = ref(10)
const orderTotal = ref(0)
const orderLoading = ref(false)

// 订单详情对话框
const showOrderDetailDialog = ref(false)
const viewingOrder = ref<Order | null>(null)

const preferences = reactive<UserPreferences>({
  interests: [], // 存储的是兴趣的 code
  language: 'zh',
})

// 通用兴趣列表
const commonInterests = ref<InterestDto[]>([])
const loadingInterests = ref(false)

// 地址管理
const showAddressDialog = ref(false)
const addressSaving = ref(false)
const editingAddress = ref<Address | null>(null)
const addressFormRef = ref<FormInstance>()

const addressForm = reactive<AddressFormData>({
  label: '家庭',
  regionCodes: ['', '', ''],
  detailAddress: '',
  isDefault: false,
  contactName: '',
  contactPhone: '',
})

const addressData = ref({
  regionCodes: ['', '', ''] as [string, string, string],
  detailAddress: '',
  provinceCode: '',
  provinceName: '',
  cityCode: '',
  cityName: '',
  districtCode: '',
  districtName: '',
})

const addressRules: FormRules = {
  label: [{ required: true, message: '请选择地址标签', trigger: 'change' }],
}

// 编辑用户资料
const showProfileDialog = ref(false)
const profileSaving = ref(false)
const profileFormRef = ref<FormInstance>()

const profileForm = reactive<UpdateProfileForm>({
  nickname: '',
  avatar: '',
  gender: undefined,
  age: undefined,
})

const profileRules: FormRules = {
  nickname: [{ max: 50, message: '昵称最多50个字符', trigger: 'blur' }],
}

// 只显示启用的兴趣，并按 sortOrder 排序
const enabledInterests = computed(() => {
  return commonInterests.value
    .filter((item) => item.enabled)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// 保存用户偏好的原始数据
const userPreferencesData = ref<string[]>([])

onMounted(async () => {
  // 先加载通用兴趣列表
  await loadCommonInterests()
  // 然后加载用户偏好
  await loadPreferences()

  // 从 URL 参数读取分页信息
  const status = (route.query.status as OrderStatus) || 'pending_payment'
  const pageNumber = route.query.pageNumber ? Number(route.query.pageNumber) : 1
  const pageSize = route.query.pageSize ? Number(route.query.pageSize) : 10

  activeTab.value = status
  orderPageNumber.value = pageNumber
  orderPageSize.value = pageSize

  await loadOrders()
  await loadAddresses()
})

// 监听通用兴趣列表加载完成，确保选中状态正确设置
watch(
  () => commonInterests.value.length,
  async (newLength) => {
    // 当通用兴趣列表加载完成且有数据时，重新设置选中状态
    if (newLength > 0 && userPreferencesData.value.length > 0) {
      await nextTick()
      // 创建新数组以确保响应式更新
      preferences.interests = [...userPreferencesData.value]
    }
  },
)

// 加载通用兴趣列表
const loadCommonInterests = async () => {
  try {
    loadingInterests.value = true
    commonInterests.value = await userApi.getCommonInterests()
    // 通用兴趣加载完成后，如果有用户偏好数据，设置选中状态
    if (userPreferencesData.value.length > 0) {
      await nextTick()
      // 创建新数组以确保响应式更新
      preferences.interests = [...userPreferencesData.value]
    }
  } catch (error) {
    console.error('获取通用兴趣列表失败:', error)
    ElMessage.error('获取兴趣列表失败')
  } finally {
    loadingInterests.value = false
  }
}

const loadPreferences = async () => {
  try {
    const data = await userStore.fetchPreferences()
    // interests 存储的是 code
    if (data.interests && Array.isArray(data.interests)) {
      userPreferencesData.value = [...data.interests]
      // 如果通用兴趣已经加载完成，await nextTick() 等待 check box DOM 渲染完成
      if (commonInterests.value.length > 0) {
        await nextTick()
        // 将后端响应数据赋值给 preferences.interests
        preferences.interests = [...data.interests]
      }
    } else {
      userPreferencesData.value = []
      preferences.interests = []
    }
    preferences.language = data.language || 'zh'
  } catch (error) {
    console.error('获取用户偏好失败:', error)
  }
}

const loadAddresses = async () => {
  try {
    await userStore.fetchAddresses()
  } catch (error) {
    console.error('加载地址列表失败:', error)
  }
}

const loadOrders = async (pageNum?: number) => {
  try {
    orderLoading.value = true
    if (pageNum !== undefined) {
      orderPageNumber.value = pageNum
    }

    // 更新 URL 参数
    updateUrlParams()

    const response = await userStore.fetchOrders({
      status: activeTab.value,
      pageNumber: orderPageNumber.value,
      pageSize: orderPageSize.value,
    })

    orders.value = response.orders // 后端返回的是 orders 字段
    orderTotal.value = response.total
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    orderLoading.value = false
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab as OrderStatus
  orderPageNumber.value = 1 // 切换 tab 时重置页码
  // 更新 URL 参数
  updateUrlParams()
  loadOrders()
}

// 更新 URL 参数
const updateUrlParams = () => {
  const query: Record<string, string | number> = {
    status: activeTab.value,
    pageNumber: orderPageNumber.value,
    pageSize: orderPageSize.value,
  }
  router.replace({ query })
}

const savePreferences = async () => {
  saving.value = true
  try {
    await userStore.updatePreferences(preferences)
    ElMessage.success('偏好保存成功')
  } catch (error) {
    console.error('偏好保存失败：', error)
    ElMessage.error('偏好保存失败')
  } finally {
    saving.value = false
  }
}

const handleConsult = (orderId: string) => {
  router.push({ name: 'order-chat', params: { orderId } })
}

// 查看订单详情
const goToDetail = (order: Order) => {
  viewingOrder.value = order
  showOrderDetailDialog.value = true
}

const goBack = () => {
  router.push({ name: 'home' })
}

const getStatusText = (status: OrderStatus) => {
  const statusMap = {
    pending_payment: '待付款',
    pending_shipment: '待发货',
    pending_receipt: '待收货',
    pending_review: '待评价',
    refund: '退款/售后',
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: OrderStatus) => {
  const typeMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
    pending_payment: 'warning',
    pending_shipment: 'warning',
    pending_receipt: 'warning',
    pending_review: 'info',
    refund: 'danger',
  }
  return typeMap[status] || 'info'
}

// 地址管理函数
const getLabelType = (label: string) => {
  const typeMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
    家庭: 'success',
    公司: 'warning',
    学校: 'info',
    其他: 'info',
  }
  return typeMap[label] || 'info'
}

const handleEditAddress = (address: Address) => {
  editingAddress.value = address
  addressForm.label = address.label
  addressForm.regionCodes = [address.provinceCode, address.cityCode, address.districtCode]
  addressForm.detailAddress = address.detailAddress
  addressForm.isDefault = address.isDefault
  addressForm.contactName = address.contactName || ''
  addressForm.contactPhone = address.contactPhone || ''

  addressData.value = {
    regionCodes: [address.provinceCode, address.cityCode, address.districtCode],
    detailAddress: address.detailAddress,
    provinceCode: address.provinceCode,
    provinceName: address.provinceName,
    cityCode: address.cityCode,
    cityName: address.cityName,
    districtCode: address.districtCode,
    districtName: address.districtName,
  }

  showAddressDialog.value = true
}

const handleDeleteAddress = async (addressId: string) => {
  try {
    await userStore.deleteAddress(addressId)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除地址失败:', error)
    ElMessage.error('删除地址失败')
  }
}

const handleSetDefault = async (addressId: string) => {
  try {
    await userStore.setDefaultAddress(addressId)
    ElMessage.success('设置默认地址成功')
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败')
  }
}

const handleCloseAddressDialog = () => {
  editingAddress.value = null
  addressForm.label = '家庭'
  addressForm.regionCodes = ['', '', '']
  addressForm.detailAddress = ''
  addressForm.isDefault = false
  addressForm.contactName = ''
  addressForm.contactPhone = ''
  addressData.value = {
    regionCodes: ['', '', ''],
    detailAddress: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    districtCode: '',
    districtName: '',
  }
}

const handleSaveAddress = async () => {
  if (!addressFormRef.value) return

  // 验证地址选择器数据
  if (
    !addressData.value.provinceCode ||
    !addressData.value.cityCode ||
    !addressData.value.districtCode
  ) {
    ElMessage.error('请选择完整的省市区')
    return
  }

  if (!addressData.value.detailAddress.trim()) {
    ElMessage.error('请输入详细地址')
    return
  }

  try {
    addressSaving.value = true

    const formData: AddressFormData = {
      label: addressForm.label,
      regionCodes: [
        addressData.value.provinceCode,
        addressData.value.cityCode,
        addressData.value.districtCode,
      ],
      detailAddress: addressData.value.detailAddress,
      isDefault: addressForm.isDefault,
      contactName: addressForm.contactName,
      contactPhone: addressForm.contactPhone,
      provinceName: addressData.value.provinceName,
      cityName: addressData.value.cityName,
      districtName: addressData.value.districtName,
    }

    if (editingAddress.value) {
      await userStore.updateAddress(editingAddress.value.id!, formData)
      ElMessage.success('更新成功')
    } else {
      await userStore.createAddress(formData)
      ElMessage.success('添加成功')
    }

    showAddressDialog.value = false
    handleCloseAddressDialog()
  } catch (error) {
    console.error('保存地址失败:', error)
    ElMessage.error('保存地址失败')
  } finally {
    addressSaving.value = false
  }
}

// 编辑资料函数
const getGenderText = (gender: string) => {
  const genderMap: { [key: string]: string } = {
    male: '男',
    female: '女',
    other: '其他',
  }
  return genderMap[gender] || ''
}

const handleCloseProfileDialog = () => {
  profileForm.nickname = ''
  profileForm.avatar = ''
  profileForm.gender = undefined
  profileForm.age = undefined
}

const handleAvatarUpload = async (file: File) => {
  // 检查文件大小
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('头像大小不能超过 5MB')
    return false
  }

  // 这里应该上传到服务器
  // 为了演示，使用 FileReader 生成本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    profileSaving.value = true
    await userStore.updateProfile(profileForm)
    ElMessage.success('资料更新成功')
    showProfileDialog.value = false
  } catch (error) {
    console.error('更新资料失败:', error)
    ElMessage.error('更新资料失败')
  } finally {
    profileSaving.value = false
  }
}

// 监听编辑资料对话框打开，初始化表单数据
watch(showProfileDialog, (newVal) => {
  if (newVal && userStore.user) {
    profileForm.nickname = userStore.user.nickname || ''
    profileForm.avatar = userStore.user.avatar || ''
    profileForm.gender = userStore.user.gender
    profileForm.age = userStore.user.age
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}
.header {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}
.header-title {
  font-size: 16px;
  font-weight: 500;
}
.content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
.user-card {
  margin-bottom: 20px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.user-details {
  flex: 1;
}
.user-details h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}
.user-details p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #999;
}
.user-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #666;
}
.preferences-card,
.address-card,
.orders-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}
.preferences-form {
  margin-bottom: 20px;
}
.order-list {
  min-height: 200px;
}
.order-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.order-no {
  font-size: 13px;
  color: #666;
}
.order-body {
  margin-bottom: 12px;
}
.order-main-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.order-info-item .label {
  color: #666;
  min-width: 80px;
}
.order-info-item .value {
  color: #333;
}
.order-info-item .value.amount {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}
.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.order-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #ff4444;
  font-weight: bold;
}
.order-time {
  font-size: 12px;
  color: #999;
}
.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.address-list {
  min-height: 100px;
}
.address-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.address-content {
  flex: 1;
}
.address-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.address-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.address-region {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.address-full {
  margin: 0;
  font-size: 13px;
  color: #666;
}
.address-contact {
  margin: 0;
  font-size: 13px;
  color: #999;
  display: flex;
  gap: 12px;
}
.address-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.avatar-upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
.avatar-uploader:hover .avatar-upload-hint {
  color: #7c3aed;
}

.loading-interests {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  color: #606266;
}

.loading-interests .el-icon {
  font-size: 16px;
}

.interests-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.interest-item {
  padding: 12px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
  min-width: 110px; /* 设置最小宽度，确保对齐 */
  text-align: center; /* 文字居中 */
}

.interest-item:hover {
  border-color: #7c3aed;
  background-color: #f5f3ff;
}

.interest-content {
  display: flex;
  align-items: center;
  justify-content: center; /* 内容居中 */
  gap: 8px;
  white-space: nowrap; /* 防止换行 */
}

.interest-icon {
  font-size: 18px;
  flex-shrink: 0; /* 图标不收缩 */
}

.interest-name {
  font-size: 14px;
  color: #303133;
  min-width: 3em; /* 设置最小宽度（约3个字符），确保对齐 */
  text-align: center; /* 文字居中对齐 */
  display: inline-block; /* 确保宽度生效 */
}

.order-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-detail-dialog h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.order-items-section {
  margin-top: 20px;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
