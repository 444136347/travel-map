import request from '@/utils/request'

export function getCityIntensity (data) {
  let cityCode = 131;
  if (Object.prototype.hasOwnProperty.call(data,'city_code')) {
    cityCode = data.city_code;
  }
  let url = '/data/city/' + cityCode + '.json';
  return request({
    url: url,
    method: 'get'
  })
}

export function getCityTopOneHundred (data) {
  return request({
    url: '/data/cities.json',
    method: 'get',
    params: data
  })
}
