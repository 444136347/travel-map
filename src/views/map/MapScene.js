import { Scene, PointLayer, HeatmapLayer, Popup, MapTheme, ExportImage, Zoom } from '@antv/l7'
import { GaodeMap } from '@antv/l7-maps'
import { getCityIntensity, getCityTopOneHundred } from '@/api/map/baidu'
import url from 'url'
import store from '../../store'

const link = url.parse(window.location.href, true)
let valueName = link.query.fetchValue || 'crowd_value_yj'
const state = store.state

export default class MapScene {
  scene;
  pointLayer;
  constructor (cityInfo) {
    let zoom = 11
    if (state.isMobile) zoom = 10
    this.scene = new Scene({
      id: 'map',
      logoVisible: false,
      logo: false,
      map: new GaodeMap({
        pitch: 35.210526315789465,
        style: 'normal',
        center: [cityInfo.city_center.longitude, cityInfo.city_center.latitude],
        zoom: zoom,
        // 请替换成自己的高德token
        token: process.env.VUE_APP_GD_KEY,
        maxZoom: 18,
        // 关闭地图缓冲区，否则截图时无法截取到地图部分
        WebGLParams: {
          preserveDrawingBuffer: true
        }
      })
    })
    this.scene.on('loaded', () => {
      // 卫星地图
      // this.scene.map.add(new window.AMap.TileLayer.Satellite())
      const mapTheme = new MapTheme({
        position: 'rightbottom'
      })
      this.scene.map.on('click', (e) => {
        console.log(e)
      })
      this.scene.addControl(mapTheme)
      const image = new ExportImage({
        position: 'rightbottom',
        onExport: (base64) => {
          state.whetherOpenMapImg = true
          state.mapImgBase64 = base64
          // this.handleDownloadQrIMg(base64, this.getRandomString())
        }
      })
      this.scene.addControl(image)

      const zoom = new Zoom({
        zoomInTitle: '放大',
        zoomOutTitle: '缩小',
        position: 'leftbottom'
      })
      this.scene.addControl(zoom)

      this.fetch(cityInfo)
    })
  }

  getRandomString (len) {
    // eslint-disable-next-line one-var
    let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
      min = 0,
      max = _charStr.length - 1,
      _str = '' // 定义随机字符串 变量
    // 判断是否指定长度，否则默认长度为15
    len = len || 15
    // 循环生成字符串
    for (var i = 0, index; i < len; i++) {
      index = (function (randomIndexFunc, i) {
        return randomIndexFunc(min, max, i, randomIndexFunc)
      })(function (min, max, i, _self) {
        // eslint-disable-next-line one-var
        let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
          numStart = _charStr.length - 10
        if (i === 0 && indexTemp >= numStart) {
          indexTemp = _self(min, max, i, _self)
        }
        return indexTemp
      }, i)
      _str += _charStr[index]
    }
    return _str
  }

  // PC端下载图片
  handleDownloadQrIMg (base64, filename) {
    // 这里是获取到的图片base64编码,这里只是个例子哈，要自行编码图片替换这里才能测试看到效果
    // 如果浏览器支持msSaveOrOpenBlob方法（也就是使用IE浏览器的时候），那么调用该方法去下载图片
    const bStr = atob(base64.split(',')[1])
    let n = bStr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bStr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], {type: 'mime'})
    var link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', filename + '.png')
    link.setAttribute('target', '_blank')
    let clickEvent = document.createEvent('MouseEvents')
    clickEvent.initEvent('click', true, true)
    link.dispatchEvent(clickEvent)
    // link.click()
  }

  changeCity (cityInfo) {
    this.keyword = ''
    this.filter = { intensity: '' }
    this.scene.setCenter([cityInfo.city_center.longitude, cityInfo.city_center.latitude])
    this.fetch(cityInfo)
  }

  fetch (cityInfo) {
    // 获取站点
    getCityIntensity({city_code: cityInfo.city_code}).then(res => {
      this.updateScene(res.data.data)
    }).catch(err => {
      console.error(err)
    })
  }

  cityList = null;
  fetchCity () {
    getCityTopOneHundred().then(res => {
      this.cityList = res.data.data
    }).catch(err => {
      console.error(err)
    })
  }

  lastData;
  updateScene (data) {
    if (!data) return
    this.lastData = data

    if (this.keyword) {
      const keyword = this.keyword
      data = Object.assign({}, data)
      data.features = data.features.filter(item => {
        return item.properties.region_name.includes(keyword)
      }) || []
    }

    if (this.filter.intensity) {
      const intensity = this.filter.intensity
      data = Object.assign({}, data)
      data.features = data.features.filter(item => {
        return parseInt(item.properties.intensity) === parseInt(intensity)
      }) || []
    }

    let pointLayer = this.pointLayer
    if (pointLayer) {
      pointLayer.setData(data)
    } else {
      if (this.layerType === 0) {
        pointLayer = this.createColumnPointLayer(data)
      } else if (this.layerType === 1) {
        pointLayer = this.createCirclePointLayer(data)
      } else {
        pointLayer = this.createHeatMapLayer(data)
      }
      this.pointLayer = pointLayer

      this.scene.addLayer(pointLayer)
      if (pointLayer.type !== 'HeatMapLayer') {
        pointLayer.on('click', (target) => {
          if (target.feature && target.feature !== 'null') {
            this.popupByClick(target.feature)
          }
        })
      } else {
        pointLayer.on('click', (target) => {
          console.log(target)
        })
      }
    }
  }

  layerType = 0
  changeLayerType (type) {
    this.layerType = type
    this.scene.removeLayer(this.pointLayer)
    this.pointLayer = null
    this.updateScene(this.lastData)
  }

  keyword = ''
  changeKeyword (value) {
    this.keyword = value
    this.updateScene(this.lastData)
  }

  filter = { intensity: '' }
  changeFilter (obj) {
    this.filter = obj
    this.updateScene(this.lastData)
  }

  createCirclePointLayer (data) {
    return new PointLayer({})
      .source(data)
      .shape('circle')
      .size(valueName, [0, 30])
      .color('intensity', (value) => {
        return this.getIntensityColor(value)
      })
      .active(true)
      .style({
        opacity: 0.5,
        strokeWidth: 1
      })
  }

  createColumnPointLayer (data) {
    return new PointLayer({})
      .source(data)
      .animate(true)
      .active(true)
      .shape('squareColumn')
      .size(valueName, h => {
        return [ 6, 6, h * 50 ]
      })
      .color('intensity', (value) => {
        return this.getIntensityColor(value)
      })
  }

  createHeatMapLayer (data) {
    return new HeatmapLayer({})
      .source(data)
      .shape('heatmap')
      .size(valueName, [ 0, 1.0 ]) // weight映射通道
      .style({
        intensity: 6,
        radius: 20,
        rampColors: {
          colors: [
            '#850101',
            '#FF4818',
            '#F7B74A',
            '#FFF598',
            '#91EABC',
            '#2EA9A1'
          ].reverse(),
          positions: [ 0, 0.2, 0.4, 0.6, 0.8, 1.0 ]
        }
      })
  }

  getIntensityColor (value) {
    if (parseInt(value) === 0) {
      return '#91EABC'
    } else if (parseInt(value) === 1) {
      return '#ffe971'
    } else if (parseInt(value) === 2) {
      return '#FF4818'
    } else if (parseInt(value) === 3) {
      return '#850101'
    } else {
      return '#969799'
    }
  }

  getIntensityText (value) {
    if (parseInt(value) === 0) {
      return '舒适'
    } else if (parseInt(value) === 1) {
      return '饱和'
    } else if (parseInt(value) === 2) {
      return '拥挤'
    } else if (parseInt(value) === 3) {
      return '火爆'
    } else {
      return '未知'
    }
  }

  popup;
  popupByClick (data) {
    if (this.popup) {
      this.scene.removePopup(this.popup)
    }
    this.popup = new Popup({
      // 初始锚点经纬度
      lngLat: { lng: data.geometry.coordinates[0], lat: data.geometry.coordinates[1] },
      // Popup 标题
      title: data.properties.region_name,
      // Popup 内容
      html: '<div>' +
        '<p>拥挤排名：第' + data.properties.sort + '名</p>' +
        '<p>拥挤状态：' + this.getIntensityText(data.properties.intensity) + '</p>' +
        '<p>拥挤指数：' + data.properties[valueName] + '</p>' +
        '<p>客流指数：' + data.properties.crowd_value_zs + '</p>' +
        '<p>所在区县：' + data.properties.area + '</p>' +
        '</div>',
      closeButton: false,
      closeOnClick: true,
      closeOnEsc: true
    })
    this.scene.addPopup(this.popup)
  }

  location (data) {
    let zoom = 11
    if (state.isMobile) zoom = 10
    this.scene.setZoomAndCenter(zoom, data.geometry.coordinates)
    this.popupByClick(data)
  }
}
