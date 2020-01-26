var express = require("express");
var router = express.Router();
const nodemailer = require("nodemailer");
const Form = require("../models/form");
const User = require("../models/user");

router.post("/api/newForm", async (req, res, next) => {
    const {metro, interest, budget, about} = req.body;

    const form = new Form({
        idAuthor: req.session.user._id,
        location: metro,
        interest,
        data: new Date(),
        about,
        likes: [],
        prise: budget
    });
    try {
        await form.save();
        res.send("form is save");
    } catch (e) {
        res.send("form is NO save");
    }
    res.send("ok");
});

router.route("/api/sendLikeMail").get(async (req, res, next) => {
    try {
        await console.log("пришел запрос");
        let user1 = req.session.user;
        let user2 = req.body.user2;
        const user1Form = await Form.findOne({idAuthor: user1._id});
        const user2Form = await Form.findOne({idAuthor: user2._id});
        if (user2Form.likes.includes(user1.idAuthor)) {                                                   //1. Проверка на повторный лайк
            res.send("Вы уже стаивли лайк данному пользователю!");
        } else {
            if (user2Form.likes.includes(user1Form.idAuthor)) {                                           // 2. Проверка пользователя, которого лайкнули на взаимный лайк
                user1Form.likes.push(user2Form.idAuthor);
                console.log(user1Form, user2Form);
                user1Form.сomparison.push(user2Form.idAuthor);                                            // 3. запись совпадения в анкеты двух юзеров
                user2Form.сomparison.push(user1Form.idAuthor);
                // сделать удаление поклонника из массива поклоников - user1Form.funs
                user1Form.save();
                user2Form.save();
                res.send("Совпадение найдено!");
                // Сделать отправку писем двум юзерам о совпадении
            } else {
                user1Form.likes.push(user2Form.idAuthor);                                                  //4. Записываем в свой массив лайков пользователя которому поставили лайк
                user1Form.save();

                async function main() {                                                                    //5. Уведомление пользователя о том что мы ему поставили лайк
                    let testAccount = await nodemailer.createTestAccount();
                    const transporter = nodemailer.createTransport({
                        host: "smtp.yandex.ru",
                        port: 465,
                        secure: true,
                        auth: {
                            user: "pekarnyavkusnaya",
                            pass: "pekarnyavkusnaya111"
                        }
                    });

                    let info = await transporter.sendMail({
                        from: '"Roomroom 👻" <pekarnyavkusnaya@yandex.ru>', // sender address
                        to: `igordg@mail.ru, ${user2.email}`, // list of receivers
                        subject: "Roomroom ✔", // Subject line
                        text: "Текст1", // plain text body
                        html:
                            '<img src="https://gorod.tomsk.ru/uploads/33808/1240896561/my_room.jpg" alt="RoomRoom"><br>' +
                            '<b>Здравствуйте! На сервисе RoomRoom у Вас появились новые лайки!</b>'
                                `<p>Лайк поставлен пользователем ${user1.first_name} ${user1.last_name}</p>`
                                `<p>Более подробная информация в Вашем профиле RoomRoom</p>`
                    });
                    console.log("Message sent: %s", info.messageId);
                    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                    res.send("Письмо отправлено!");
                }
                main().catch(console.error);
                user2Form.funs.push(user1Form.idAuthor)                                                     // 6.запись нас в массив "поклонников" данного пользователя
                user1Form.save();
                user2Form.save();
            }
        }
    } catch (error) {
        next(error);
    }
});

router.route("/api/findSimilarUsers").post(async (req, res, next) => {
    try {
        await console.log("пришел запрос");
        let user = req.session.user;
        const userForm = await Form.findOne({idAuthor: user._id});
        let arr1 = userForm.interest;
        let arr2 = [];
        let arr3 = await Form.find();
        for (let i = 0; i < arr3.length; i++) {
            if (arr1.location === arr3[i].location) {
                arr2.push(arr3[i]);
            }
        }
        let allComparison = [];

        arr2.map(function (e) {
            let сomparison = [];
            let userId = {idAuthor: e.idAuthor};
            let location = {location: e.location};
            let data = {data: e.data};
            let about = {about: e.about};
            let likes = {likes: e.likes};
            let prise = {prise: e.prise};

            сomparison.push(userId);
            сomparison.push(location);
            сomparison.push(data);
            сomparison.push(about);
            сomparison.push(likes);
            сomparison.push(prise);

            let arrInterests = [];
            for (let i = 0; i < arr1.interest.length; i++) {
                for (let k = 0; k < e.interest.length; k++) {
                    if (arr1.interest[i] === e.interest[k]) {
                        arrInterests.push(arr1.interest[i]);
                    }
                }
            }
            сomparison.push(arrInterests);
            allComparison.push(сomparison);
        });

        let lengthAllComparison = [];
        for (let i = 20; i >= 0; i--) {
            for (let j = 0; j < allComparison.length; j++) {
                if (allComparison[j][6].length === i) {
                    lengthAllComparison.push(allComparison[j]);
                }
            }
        }

        let finishREsult = [];

        for (let i = 0; i < lengthAllComparison.length; i++) {
            if (lengthAllComparison[i][6].length !== 0) {
                finishREsult.push(lengthAllComparison[i]);
            }
        }

        sortUserPrise = [];

        for (let i = 0; i < finishREsult.length; i++) {
            if (finishREsult[i][5].prise <= arr1.prise) {
                sortUserPrise.push(finishREsult[i]);
            }
        }

        console.log(sortUserPrise);

        let arrSortUserId = [];

        for (let i = 0; i < sortUserPrise.length; i++) {
            arrSortUserId.push(sortUserPrise[i][0].idAuthor);
        }
        console.log(arrSortUserId);
        res.json(sortUserPrise);
    } catch (error) {
        next(error);
    }
});


module.exports = router;
