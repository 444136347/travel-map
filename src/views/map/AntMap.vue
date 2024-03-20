<template>
  <div class="page">
    <div id="map"/>
    <div class="topDiv">
      <van-sticky>
        <van-dropdown-menu>
          <van-dropdown-item ref="cityDropdown" :title="getCityTitle" @open="openCity">
            <van-index-bar>
              <div v-if="cityList">
                <div v-for="(item, index) in cityList" :key="index">
                  <van-index-anchor style="background-color: #f7f8fa" :index="index"></van-index-anchor>
                  <div v-if="cityList[index].length !== 0">
                    <van-cell  v-for="(row, rowIndex) in item" :key="rowIndex" :title="row.city_name" @click="clickCity(row)"/>
                  </div>
                  <div v-else>
                    <van-cell title="暂时为空" />
                  </div>
                </div>
              </div>
              <van-loading v-else class="van-load" size="16px" text-size="13px" vertical>为您努力加载中...</van-loading>
            </van-index-bar>
          </van-dropdown-item>
          <van-dropdown-item :title="getTypeTitle" v-model="typeActive" :options="typeData" @change="onChangeTag"/>
          <van-dropdown-item title="条件筛选" ref="filterRef" @close="closeScreen">
            <van-cell centet title="拥堵状况" label="单选">
              <template #right-icon>
                <van-radio-group v-model="filter.intensity">
                  <van-radio name="" checked-color="#ee0a24">全部</van-radio>
                  <van-radio name="0" checked-color="#ee0a24">舒适</van-radio>
                  <van-radio name="1" checked-color="#ee0a24">饱和</van-radio>
                  <van-radio name="2" checked-color="#ee0a24">拥挤</van-radio>
                  <van-radio name="3" checked-color="#ee0a24">火爆</van-radio>
                </van-radio-group>

              </template>
            </van-cell>
            <div style="padding: 5px 16px;">
              <van-button type="danger" block round @click="onScreenConfirm">
                确认
              </van-button>
            </div>
          </van-dropdown-item>
        </van-dropdown-menu>
      </van-sticky>
    </div>
    <div class="interaction">
      <div class="search-bar">
        <input
            type="text"
            class="ipt"
            v-model="keyword"
            placeholder="搜索景区、枢纽、广场"
            @click="e => e.target.focus()"
            @focus="searchFocus"
        />
        <template v-if="keyword">
          <div class="clear-icon" @click="clickClearKeyword"></div>
        </template>
        <template v-else>
          <div class="scope-icon"></div>
        </template>
      </div>
      <div class="searchlist" v-if="keyword || showAll">
        <div class="searchitem" v-for="(item,index) in addressList" :key="index" @click="onLocation(item)">
          {{ showAll ? ('（第' + item.properties.sort + '名）') : '' }}{{item.properties.region_name}}
        </div>
      </div>
    </div>
    <van-dialog
        @confirm="operaDialog"
        @cancel="operaDialog"
        @close="operaDialog"
        v-model="openMapImg"
        title="图片预览-长按保存"
        show-cancel-button
    >
      <div style="text-align: center">
        <img width="150" height="270" :src="mapImgBase64"/>
      </div>
    </van-dialog>
    <div ref="container" style="height: 30px;margin-top: 12px">
      <van-sticky :container="container">
        <van-tag @click="showHelp = true" plain style="position: absolute;right: 0;" color="#ed6a0c"><van-icon name="warning-o"/>&nbsp;必读</van-tag>
        <van-tag @click="showAllAction" plain style="margin-top:25px;position: absolute;right: 0;" color="#576b95"><van-icon name="award-o" />&nbsp;排名</van-tag>
      </van-sticky>
    </div>
    <van-popup @close="showHelp = false" v-model="showHelp" closeable close-icon="close" round position="bottom" :style="{ height: '40%' }" >
      <div class="helpDiv">
        <van-divider>使用手册</van-divider>
        <div class="helpDivInfo">
          <p>1、目前展示城市下实时的景区、枢纽、广场数据，是热点地点，并非全部数据，每6分钟数据会有变化。</p>
          <p>2、头部为过滤栏，可选择城市（仅限国内100个靠前地市），选择数据展示样式，条件筛选可以选择拥堵情况。</p>
          <p>3、过滤栏下面为搜索栏，可查询景区、枢纽、广场，为模糊搜索，右边则为使用说明。</p>
          <p>4、底部为功能栏，从左往右分别为（1）放大缩小地图组件（2）实时截图组件（3）地图主题组件。</p>
          <p>5、颜色解释：（1）<span style="color: #91EABC">绿色</span>表示舒适（2）<span style="color: #ffe971">黄色</span>表示饱和
            （3）<span style="color: #FF4818">橘色</span>表示拥挤（4）<span style="color: #850101">深红色</span>表示火爆。</p>
          <p>6、客流指数为区域范围内实时客流的指数化值，客流指数越大表示该区域内客流越多。</p>
          <p>7、热力图无法查看地点详情。</p>
        </div>
        <van-divider>使用说明</van-divider>
        <div class="helpDivInfo">
          <p>1、地图及相关数据使用高德和百度地图</p>
          <p>2、该页面仅供公益使用</p>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import MapScene from './MapScene'
import { mapGetters, mapState, mapMutations } from 'vuex'
import { Notify, Divider, Popup, Icon, Tag, Dialog, Sticky, DropdownMenu, DropdownItem, CellGroup, Cell, Switch, RadioGroup, Radio, Button, IndexBar, IndexAnchor, Loading } from 'vant'

let scene
export default {
  components: {
    [Notify.Component.name]: Notify.Component,
    [Dialog.Component.name]: Dialog.Component,
    [Divider.name]: Divider,
    [Popup.name]: Popup,
    [Sticky.name]: Sticky,
    [Icon.name]: Icon,
    [Tag.name]: Tag,
    [CellGroup.name]: CellGroup,
    [Cell.name]: Cell,
    [Button.name]: Button,
    [Switch.name]: Switch,
    [RadioGroup.name]: RadioGroup,
    [Radio.name]: Radio,
    [IndexBar.name]: IndexBar,
    [IndexAnchor.name]: IndexAnchor,
    [Loading.name]: Loading,
    [DropdownMenu.name]: DropdownMenu,
    [DropdownItem.name]: DropdownItem
  },
  data () {
    return {
      openMapImg: false,
      showAll: false,
      showHelp: false,
      container: null,
      typeActive: 0,
      typeData: [{
        text: '柱状图',
        value: 0
      }, {
        text: '气泡图',
        value: 1
      }, {
        text: '热力图',
        value: 2
      }],
      keyword: '',
      addressList: [],
      currentCity: {
        city_code: '131',
        city_name: '北京',
        city_center: { longitude: 116.407171, latitude: 39.904689 }
      },
      cityList: [],
      oldFilter: { // 保存上一次过滤条件
        intensity: ''
      },
      filter: {
        intensity: ''
      }
    }
  },
  computed: {
    ...mapState([
      'mapImgBase64',
      'whetherOpenMapImg'
    ]),
    ...mapGetters([
      'isMobile'
    ]),
    getTypeTitle () {
      let title = '样式：柱形图'
      switch (this.typeActive) {
        case 0:
          title = '样式：柱形图'
          break
        case 1:
          title = '样式：气泡图'
          break
        case 2:
          title = '样式：热力图'
          break
      }
      return title
    },
    getCityTitle () {
      return this.currentCity.city_name ? ('所选城市：' + this.currentCity.city_name) : '所选城市：厦门'
    }
  },
  created () {
    this.container = this.$refs.container
    document.title = '旅行地图'
  },
  mounted () {
    let city = this.$global.localStorageGetItem('currentAntMaoCity')
    if (city) {
      this.currentCity = this.$global.localStorageGetItem('currentAntMaoCity')
    }
    scene = new MapScene(this.currentCity)
    scene.fetchCity()
  },
  watch: {
    keyword (value) {
      if (scene && scene.lastData && value) {
        this.addressList = scene.lastData.features.filter(item => {
          return item.properties.region_name.includes(value)
        })
      } else {
        this.addressList = []
      }
      if (scene) {
        scene.changeKeyword(value)
      }
    },
    whetherOpenMapImg (val) {
      this.openMapImg = val
    }
  },
  methods: {
    ...mapMutations([
      'setWhetherOpenMapImg'
    ]),
    clickClearKeyword () {
      this.keyword = ''
      if (this.showAll) {
        this.showAll = false
      }
    },
    searchFocus () {
      if (this.showAll) {
        this.showAll = false
      }
    },
    showAllAction () {
      if (scene.lastData === undefined || !scene.lastData.features) {
        Notify({ type: 'warning', message: '请等待数据加载' })
        return
      }
      this.keyword = ''
      if (!this.showAll) {
        this.addressList = scene.lastData.features
      } else {
        this.addressList = []
      }
      this.showAll = !this.showAll
    },
    operaDialog () {
      this.setWhetherOpenMapImg(false)
    },
    clickCity (row) {
      this.currentCity = row
      this.$global.localStorageSetItem('currentAntMaoCity', row, 60 * 60 * 1000)
      scene.changeCity(row)
      this.$refs.cityDropdown.toggle()
    },
    onChangeTag (value) {
      scene.changeLayerType(value)
    },
    onLocation (data) {
      this.keyword = data.properties.region_name
      scene.location(data)
    },
    openCity () {
      this.cityList = scene.cityList
    },
    onScreenConfirm () {
      this.$refs.filterRef.toggle()
    },
    closeScreen () {
      if (this.judgeFilter()) {
        scene.changeFilter(this.filter)
      }
    },
    setOldFilter () { // 设置旧的过滤值
      this.oldFilter = {
        intensity: this.filter.intensity
      }
    },
    judgeFilter () { // 判断过滤条件有变化
      let whether = this.filter.intensity !== this.oldFilter.intensity
      if (whether) {
        this.setOldFilter()
      }
      return whether
    }
  }
}
</script>
<style scoped lang="less">
/deep/ .l7-select-control--image {
  width: 316px;
}

/deep/ .van-dropdown-menu__title {
  font-size: 14px;
}

/deep/ .van-dropdown-menu__bar {
  height: 30px;
}
</style>
<style scoped lang="less">
@r: 1px;
.page {
  position: absolute;
  left: 0*@r;
  width: 100vw;
  height: 100vh;

  .helpDiv {
    padding-top: 15px;
    .helpDivInfo {
      font-size: 13px;
      padding: 0 10px 10px 10px;
    }
  }

  .topDiv {
    z-index: 1001;
    position: relative;
  }

  .interaction {
    position: absolute;
    z-index: 1000;

    .tabradio {
      margin: 20*@r;
    }

    .search-bar {
      width: 270*@r;
      height: 30*@r;
      margin-left: 24*@r;
      background-color: #fff;
      box-shadow: 0 1*@r 4*@r rgba(150, 150, 150, 0.16);
      margin-top: 12*@r;
      display: flex;
      border-radius: 6*@r;
      overflow: hidden;

      .label {
        font-size: 14*@r;
        background-color: #eaeefb;
        width: 100*@r;
        display: flex;
        justify-content: center;
        align-items: center;

      }

      .ipt {
        flex: 1;
        height: 100%;
        min-width: 100*@r;
        border: none;
        outline: none;
        background: none;
        padding: 0 12*@r;
        font-size: 14*@r;
        color: #626e8b;
      }

      .scope-icon,
      .clear-icon {
        width: 24*@r;
        height: 24*@r;
        align-self: center;
        margin-right: 8*@r;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center center;
      }

      .scope-icon {
        background-image: url(~@/assets/img/antMap/scope.png);
      }

      .clear-icon {
        background-image: url(~@/assets/img/antMap/clear_grey.png);
      }
    }

    .searchlist {
      width: 270*@r;
      max-height: 140*@r;
      margin-left: 24*@r;
      margin-top: 12*@r;
      background-color: #fff;
      box-shadow: 0 1*@r 4*@r rgba(150, 150, 150, 0.16);
      border-radius: 6*@r;
      overflow-y: scroll;
      font-size: 14*@r;

      .searchitem {
        height: 24*@r;
        padding-left: 12*@r;
        line-height: 24*@r;

        &:hover {
          background-color: #eaeefb;
        }
      }
    }
  }
}
</style>
