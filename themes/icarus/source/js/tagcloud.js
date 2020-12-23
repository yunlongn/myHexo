var alltags=document.getElementById("tags");
var tags=alltags.getElementsByTagName("a");
for (var i = tags.length - 1; i >= 0; i--) {
    var r=Math.floor(Math.random()*75+130);
    var g=Math.floor(Math.random()*75+100);
    var b=Math.floor(Math.random()*75+80);
    var z=Math.floor(Math.random()*10 + 13);
    tags[i].style.color = "rgb("+r+","+g+","+b+")";
    tags[i].style["font-size"] = z + "px";

}
