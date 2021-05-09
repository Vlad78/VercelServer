// server.js
// where your node app starts

class Order {
  constructor(){
    this.cardName = ''
    this.cardLabels = []
    this.cardList = ''
    this.dateOfManufacture = new tempus()
    this.customerName = ''
    this.phone = ''
    this.address = ''
    this.comment = ''
    this.cakeInscription = []
    this.number = ''
    this.delivery = {
      exists: false,
      dateAndTime: ['', new tempus(), ''], // [0] - пометка если завтра [1] - дата доставки [2] - время доставки
      payment: ''
    }
    this.paid = false
    this.source = ''
  }

  toTGDriver() {
    var sign = ''
      this.cardLabels.forEach(element => {

        switch (element) {
          case '5f732800ff663327c3fbd0f8':
            sign += '🔵'
            break
          case '5ef9e4b20803133679c5cdf3':
            sign += '🟣'
            break
          case '5ef9e4b24045be77a89ac083':
            sign += '🔴'
            break
          case '5f8725fa97f86380364b78eb':
            sign += '🟡'
            break
          case '601270e5f2401d371c712ce7':
            sign += '⚫'
            break
          case '5ef9e4b1dd10b04388563f30':
            sign += '🟢'
            break
          }
      })


    let str = `${this.cardName} ${sign}
    \`Дата:\` ${this.delivery.dateAndTime[0]} ${this.delivery.dateAndTime[1]} ${this.delivery.dateAndTime[2]}
    \`Адрес:\` [${this.address}](${this.address != '' ? 'https://yandex.by/maps/?text=' : ''}${this.address})
    \`Оплата:\` ${this.delivery.payment}
    \`Имя и телефон:\` ${this.customerName} [${this.phone}](tel:${this.phone})
    \`Комментарий:\` ${this.comment}
    `
    return str
  }
}

class ServerParser {
  constructor(order){
    this.cardNew = order
  }
  insalesToOrder(request){

    // название карточки и надписи к тортам
    request.body.order_lines.forEach(element => {
      this.cardNew.cardName += `${element.title} ${element.quantity} шт`
      if (element.comment) {
        this.cardNew.cardName += ` (+надпись);\n`
        if (!this.cardNew.cardLabels.includes("601270e5f2401d371c712ce7")) this.cardNew.cardLabels.push("601270e5f2401d371c712ce7")
        this.cardNew.cakeInscription.push("[" + element.comment + "]")
      } else {
        this.cardNew.cardName += ';\n'
      }
    })

    // дата, время доставки, лэйблы и список
    switch(request.body.delivery_title) {
      case 'Курьером в Минске (на сегодня и завтра)':
        this.cardNew.cardList = '5f732619e32a4c3d01e7d0bb'
        this.cardNew.delivery.exists = true
        this.cardNew.cardLabels.push('5f732800ff663327c3fbd0f8')
        break
      case 'Курьером в Минске (предзаказ заранее)':
        this.cardNew.cardList = '5f732619e32a4c3d01e7d0bb'
        this.cardNew.delivery.exists = true
        this.cardNew.cardLabels.push('5f732800ff663327c3fbd0f8')
        break
      case 'Самовывоз':
        this.cardNew.cardList = '5f73260fa857308dfac5e355'
        this.cardNew.delivery.exists = false
        this.cardNew.cardLabels.push('5ef9e4b20803133679c5cdf3')
        break
    }

    let deliveryDate = tempus(request.body.delivery_date)
console.log("request.body.delivery_from_hour = " + request.body.delivery_from_hour)
    if (request.body.delivery_from_hour == '' || request.body.delivery_from_hour == null) {
      this.cardNew.dateOfManufacture = new tempus(deliveryDate.format('%Y-%m-%d'))
      this.cardNew.dateOfManufacture.format('%Y-%m-%d')
      this.cardNew.delivery.dateAndTime[1] = deliveryDate.format('%Y-%m-%d') // здесь работает
      // this.cardNew.delivery.dateAndTime[2] = `с ${request.body.delivery_from_hour} до ${request.body.delivery_to_hour}`

    } else {
      if (request.body.delivery_from_hour<14){  // в этом случае идет раздвоение даты - дата доставки и дата производства
        this.cardNew.dateOfManufacture = new tempus(deliveryDate.format('%Y-%m-%d'))
        this.cardNew.dateOfManufacture.calc({year: 0, month: 0, day: -1})

        this.cardNew.delivery.dateAndTime[0] = 'завтра'
        this.cardNew.delivery.dateAndTime[1] = deliveryDate.format('%Y-%m-%d') // здесь работает
        this.cardNew.delivery.dateAndTime[2] = `с ${request.body.delivery_from_hour} до ${request.body.delivery_to_hour}`
      } else {
        this.cardNew.dateOfManufacture = new tempus(deliveryDate.format('%Y-%m-%d'))
        this.cardNew.dateOfManufacture.format('%Y-%m-%d')
        this.cardNew.delivery.dateAndTime[1] = deliveryDate.format('%Y-%m-%d') // здесь работает
        this.cardNew.delivery.dateAndTime[2] = `с ${request.body.delivery_from_hour} до ${request.body.delivery_to_hour}`
      }
    }

    // второй более короткий вариант записи
    // if ((request.body.delivery_from_hour == '' || null) || request.body.delivery_from_hour>13) {
    //   this.cardNew.dateOfManufacture = new tempus(deliveryDate.format('%Y-%m-%d'))
    //   this.cardNew.dateOfManufacture.format('%Y-%m-%d')
    //   this.cardNew.delivery.dateAndTime[1] = deliveryDate.format('%Y-%m-%d') // здесь работает
    //   this.cardNew.delivery.dateAndTime[2] = `с ${request.body.delivery_from_hour} до ${request.body.delivery_to_hour}`
    //   } else {
    //   this.cardNew.dateOfManufacture = new tempus(deliveryDate.format('%Y-%m-%d'))
    //   this.cardNew.dateOfManufacture.calc({year: 0, month: 0, day: -1})
    //   this.cardNew.delivery.dateAndTime[0] = 'завтра'
    //   this.cardNew.delivery.dateAndTime[1] = deliveryDate.format('%Y-%m-%d') // здесь работает
    //   this.cardNew.delivery.dateAndTime[2] = `с ${request.body.delivery_from_hour} до ${request.body.delivery_to_hour}`
    //   }


    // адрес
    if (request.body.shipping_address.full_delivery_address != '' || null) {
      this.cardNew.address = `${request.body.shipping_address.full_delivery_address}`
    }

    // имя и телефон
    this.cardNew.customerName = request.body.shipping_address.name
    this.cardNew.phone = request.body.shipping_address.phone

    // оплата
    switch (request.body.payment_title){
      case 'Наличными курьеру':
        this.cardNew.delivery.payment = `${request.body.total_price} руб. наличными курьеру`
        break
      case 'Картой через WebPay':
        this.cardNew.delivery.payment = `Картой через WebPay. Ожидание оплаты`
        break
      case 'В кофейне при получении заказа -15.0%':
        this.cardNew.delivery.payment = `В кофейне при получении заказа`
        break
    }
    if(request.body.paid_at != null) {
      this.cardNew.delivery.payment = `Оплачен`
      this.cardNew.paid = true
    }

    // источник
    this.cardNew.number = request.body.number

    // комментарий к заказу
    if (request.body.comment) {
      this.cardNew.comment = request.body.comment  // новая реализация
    }
    // id заказа
    this.cardNew.id = request.body.id
   console.log('Карта готова')
  return this.cardNew
  }

  createCardOnTrello(obj){

    var newCard = {
      name: obj.cardName,
      due: obj.dateOfManufacture.format('%Y-%m-%d'),
      idList: obj.cardList,
      idLabels: obj.cardLabels,
      desc:
      `\`Адрес:\` ${obj.address}
      \`Дата и время доставки:\` ${obj.delivery.dateAndTime.join(' ')}
      \`Имя и телефон:\` ${obj.customerName} ${obj.phone}
      \`Оплата:\` ${obj.delivery.payment}
      \`Источник:\` insales ${obj.number}
      \`Комментарий:\` ${obj.comment}`,
    }


    let response = fetch(`https://api.trello.com/1/cards?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(newCard)
    })

      .then(function (response) {
        console.log('Ответ трелло: ' + response.status)

        if (response.ok) {
          var changeStatus = {
            fulfillment_status: 'accepted',
          }
          let inSalesStatus = fetch(`https://myshop-sw911.myinsales.by/admin/orders/${obj.id}.json`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Basic M2ZiM2MyM2I3YmRmNmJiZTEyMGRiNDYyZTFhZmE2ZmY6MTg5MzI5ZjVmZGI3NmNjNTM5NmNmYjdiYzc4N2M5ZDI='
            },
            body: JSON.stringify(changeStatus)
          })

            .then(function (inSalesStatus) {
              if (inSalesStatus.ok){
                console.log('Ответ инсэйлс: ' + inSalesStatus.status)
              } else {
                return 'Заказ № ' + obj.number + ' ошибка Insales' + inSalesStatus.status + '\n'
              }
            })
        } else {
            return 'Заказ № ' + obj.number + ' ошибка Trello' + response.status + '\n'
        }  //---------------конец подтверждения от trello
    })  //----------------конец отправки сообщения в trello
    return true
  }

  updateCardTrello(){

  }

  getOrderFromTrello(){

  }

  //////////////////  ПОЛУЧАЕМ СЕГОДНЯШНИЕ КАРТЫ ИЗ ТРЕЛЛО  //////////////////
  getTodayOrdersFromTrello(callback){  // колбэк содержит массив из трех массивов: заказы для доставки, заказы для самовывоза, заказы без маркировки
    fetch(`https://api.trello.com/1/boards/${process.env.TRELLO_WORKBOARD_ID}/cards?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`)
    .then(function(res){
      if (!res.ok) {
        return `ошибка трелло ${res.status}`  // возвращает ошибку
      }
      return res.json()
    })
    .then(function(json){
      let cardsFromTrello = json
      var pseudoArray = Object.entries(cardsFromTrello)

      var messageForCoffeeshop = ''
      var cardsArrayDelivery = []
      var cardsArrayPickUp = []
      var cardsArrayOther = []

      for (var i = 0; i<pseudoArray.length; i++){
        if (pseudoArray[i][1].due != null){
          if(pseudoArray[i][1].due.substring(0, 10) == tempus().format('%Y-%m-%d')){  //отбираем сегодняшние карточки
          // создаем карточку как объект и добавляем в массив сортируем по доставке по времени и по самовывозу
          // это будущий парсер. будем составлять объект карточки и потом добавим ее в массив

            let cardNew = new Order  // создаем свежий объект-контейнер
            cardNew.cardName = pseudoArray[i][1].name  // неверно, нужно переделать с учетом надписи на торт
            cardNew.cardLabels = pseudoArray[i][1].idLabels
            cardNew.cardList = pseudoArray[i][1].idList
            cardNew.dateOfManufacture = pseudoArray[i][1].due.substring(0, 10)

// REGEXPы. парсер на regexp нужно запилить отдельным методом
            var str = pseudoArray[i][1].desc
            let regex = /`[:a-zA-Zа-яА-Я0-9\s]+`[^`]+/g;
            let regexDate = /(?<=\D|^)(?<year1>\d{4})(?<sep>[^\w\s])(?<month1>1[0-2]|0[1-9])\k<sep>(?<day1>0[1-9]|[12][0-9]|(?<=11\k<sep>|[^1][4-9]\k<sep>)30|(?<=1[02]\k<sep>|[^1][13578]\k<sep>)3[01])(?=\D|$)|(?<day>0[1-9]|1[0-9]|2[0-9]|3[01]).(?<month>0[1-9]|1[012]).(?<year>[0-9]{4})/g
            let temp;
            let match = []

            while ((temp = regex.exec(str)) !== null) {
              if (temp.index === regex.lastIndex) {
                regex.lastIndex++;
              }
              temp = temp.toString().replace(/^\s+|^\n+|\s+$/g, '')
              match.push(temp)
            }
            if(match == ''){
              messageForCoffeeshop = `карточка не соответствует стандарту заполнения ${pseudoArray[i][1].name}`
              cardNew.comment = pseudoArray[i][1].desc
              cardNew.cardLabels.forEach(element => {
                switch(element){
                  case '5f732800ff663327c3fbd0f8':
                    cardsArrayDelivery.push(cardNew)
                  break
                  case '5ef9e4b20803133679c5cdf3':
                    cardsArrayPickUp.push(cardNew)
                  break
                    cardsArrayOther.push(cardNew)
                  break
                }
              })
              continue
            }

            for(let k = 0; k < match.length; k++){

              // Адрес
              if(match[k].includes('Адрес:')){
                if((/[a-zA-Zа-яА-Я0-9]/g).test(match[k].substring(8))){
                  if((/\[.*\]/g).test(match[k])){
                  cardNew.address = match[k].match(/\[.*\]/g).toString().substring(1, match[k].match(/\[.*\]/g).toString().length-1)
                  } else {
                  cardNew.address = match[k].substring(8)
                  }
                  cardNew.delivery.exists = true
                } else {
                  cardNew.address = ''
                  cardNew.delivery.exists = false
                }
              }

              // Дата и время доставки
              if(match[k].includes('Дата и время доставки:')){
                if(cardNew.delivery.exists){
                  if(match[k].includes('завтра')){
                    cardNew.delivery.dateAndTime[0] = 'завтра'
                    // cardNew.delivery.dateAndTime[1] = new tempus(match[k].substring(32, 42)).format('%Y-%m-%d')
                    cardNew.delivery.dateAndTime[1] = match[k].substring(32, 42)
                  } else {
                    cardNew.delivery.dateAndTime[0] = ''
                    cardNew.delivery.dateAndTime[1] = match[k].match(regexDate)
                  }

                  (/с \d+ до \d+/g).test(match[k]) ? cardNew.delivery.dateAndTime[2] = match[k].match(/с \d+ до \d+/g) : cardNew.delivery.dateAndTime[2] = ''
                }
              }

              // Имя и телефон
              if(match[k].includes('Имя и телефон:')){
                cardNew.customerName = match[k].substring(16).match(/[a-zA-Zа-яА-Я\s]+/g).toString().trim()
                cardNew.phone = match[k].match(/[+0-9]+/g)
              }

              // Оплата
              if(match[k].includes('Оплата:')){
                if (match[k].substring(10, 17) === 'Оплачен' | 'оплачен') {
                  cardNew.paid = true
                  cardNew.delivery.payment = `Оплачен`
                } else {
                  cardNew.paid = false
                  cardNew.delivery.payment = match[k].substring(10)
                }
              }

              // Источник
              if(match[k].includes('Источник:')){
                cardNew.source = match[k].substring(12)
                if((/insales/g).test(match[k])) cardNew.number == match[k].match(/\d+/g)
              }

              // Комментарий
              if(match[k].includes('Комментарий:')){
                cardNew.comment = match[k].substring(15)
              }
            } //------------цикл который перебирает дискрипшион карточки

            cardNew.cardLabels.forEach(element => {
              switch(element){
                case '5f732800ff663327c3fbd0f8':
                  cardsArrayDelivery.push(cardNew)
                break
                case '5ef9e4b20803133679c5cdf3':
                  cardsArrayPickUp.push(cardNew)
                break
                  cardsArrayOther.push(cardNew)
                break
              }
            })
          } //--------------цикл проверка даты, чтобы отобрать сегодняшниие карточки
        }
      }  //-----------------цикл по всем присланным из трелло карточкам

      callback([cardsArrayDelivery, cardsArrayPickUp, cardsArrayOther])
      //-------коллбэк один массив заказов с доставкой [0], второй с самовывозом [1], третий без маркировки [2]
    }) //-------------------кол бэк из трелло
  }

  parseTrelloDesc(){

    return  // паршеная информация из трелло, скорее всего массив строк
    }
}

// ca77e4e88e2582521b1c7aa0d199b2a7223491a8577250ac49cb9c63a4a31065
// MTM4ODYyMTg3NjpBQUVlcG5ndFhrbkQtOWtuczNjQ2UtemtJUXA2TzEzVDEybw==
// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const tempus = require("tempusjs")
const express = require("express");
const fetch = require('node-fetch');
const app = express();
const ontime = require('ontime')
const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true})
const chats = {
  office: '-567510185'
}

app.use(express.static("public"));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.post('/webhook', function (req, res) {
  res.send('Success')
  let newOrder = new Order  // инициализируем объект-заказ
  let parser = new ServerParser(newOrder)  // создаем парсер с объектом
  parser.insalesToOrder(req)  // выполняем парсинг
  let response = parser.createCardOnTrello(newOrder)  // парсим в карточку трелло и создаем новую карточку. Метод возвращает ответ
  if(response != true){
    // отправляем сообщение боту телеграмма в офис если есть ошибка
    bot.sendMessage(chats.office, response)
    //----------------конец отправки сообщения боту в телеграмм
  }
})  //------------------конец приема сообщения от insales

console.log('Текущее время: ' + tempus().format('%Y-%m-%d %H:%M:%S'));

bot.onText(/\/dlv/, function (msg, match) {
  var chatId = msg.chat.id; // Получаем ID отправителя

  new ServerParser().getTodayOrdersFromTrello((orders) => {
    orders[0].forEach((element) => {
      if(element != null || element != '') {

        bot.sendMessage(chatId, element.toTGDriver(), {
          parse_mode: "Markdown", disable_web_page_preview: true
        })
        .then(function (response) {
        console.log('ответ бота: ' + response.ok)
        })
      } else { // это не работает, видимо, нужно искать в запросе к трелло

        bot.sendMessage(chatId, 'Сегодня заказов нету', {
          parse_mode: "Markdown", disable_web_page_preview: true
          })
        .then(function (response) {
        console.log('ответ бота: ' + response.ok)
        })
      }
    })
  })
})

bot.on("polling_error", console.log)

bot.onText(/\/all/, function (msg, match) {
  var chatId = msg.chat.id; // Получаем ID отправителя

  new ServerParser().getTodayOrdersFromTrello((orders) => {
    orders.forEach(el => {
      el.forEach((element) => {
        if(element != null || '') {
          bot.sendMessage(chatId, element.toTGDriver(), {
            parse_mode: "Markdown", disable_web_page_preview: true
          })
          .then(function (response) {
          console.log('ответ бота: ' + response.ok)
          })
        }
      })
    })
  })
})

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
