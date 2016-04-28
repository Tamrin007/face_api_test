$(function() {
    //videoタグを取得
    var video = document.getElementById('camera');
    //カメラが起動できたかのフラグ
    var localMediaStream = null;
    //カメラ使えるかチェック
    var hasGetUserMedia = function() {
        return (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    };

    //エラー
    var onFailSoHard = function(e) {
        console.log('エラー!', e);
    };

    if (!hasGetUserMedia()) {
        alert("未対応ブラウザです。");
    } else {
        window.URL = window.URL || window.webkitURL;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        navigator.getUserMedia({
            video: true
        }, function(stream) {
            video.src = window.URL.createObjectURL(stream);
            localMediaStream = stream;
        }, onFailSoHard);
    }

    $("#submit").click(function() {
        if (localMediaStream) {
            var canvas = document.getElementById('canvas');
            //canvasの描画モードを2dに
            var ctx = canvas.getContext('2d');
            var img = document.getElementById('img');

            //videoの縦幅横幅を取得
            var w = video.offsetWidth;
            var h = video.offsetHeight;

            //同じサイズをcanvasに指定
            canvas.setAttribute("width", w);
            canvas.setAttribute("height", h);

            //canvasにコピー
            ctx.drawImage(video, 0, 0, w, h);

            //ここから画像のバイナリ化
            var can = canvas.toDataURL();
            // Data URLからBase64のデータ部分のみを取得
            var base64Data = can.split(',')[1];
            // base64形式の文字列をデコード
            var data = window.atob(base64Data);
            var buff = new ArrayBuffer(data.length);
            var arr = new Uint8Array(buff);

            // blobの生成
            for (var i = 0, dataLen = data.length; i < dataLen; i++) {
                arr[i] = data.charCodeAt(i);
            }
            var blob = new Blob([arr], {
                type: 'image/png'
            });

            var formData = new FormData();
            formData.append('img', blob);
        }
        $.ajax({
                url: "https://api.projectoxford.ai/emotion/v1.0/recognize",
                beforeSend: function(xhrObj) {
                    // Request headers
                    xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
                    xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "625b93009b0040be9b9357ac0214778d");
                },
                type: "POST",
                // Request body
                data: blob,
                dataType: 'json',
                contentType: false,
                processData: false,
            })
            .done(function(data) {
                var response = JSON.stringify(data, null, "    ");
                var scores = data[0].scores;
                $('#response').html("<pre>" + response + "</pre>");
                var expression = getMax(scores);
                $('#message').html('<p class="large">Your facial expression seems in ' + expression + ' !!</p>');
            })
            .fail(function() {
                alert("error");
            });
    });
});

function getMax(object) {
    var max = 0;
    var key;
    for (var variable in object) {
        if (max < parseFloat(object[variable])) {
            max = parseFloat(object[variable]);
            console.log(parseFloat(object[variable]));
            key = variable;
            console.log(variable);
        }
    }
    return key;
}
