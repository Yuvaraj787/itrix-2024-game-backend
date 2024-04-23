import{u as x,c as p,r as a,d as c,e as l,j as o,B as f}from"./index-DwJcsY6s.js";import{F as b,f as y}from"./index-Bu1k_WM4.js";import{C as j}from"./index-Cmu-M0pA.js";import"./index-CCUExXEF.js";const n=new j;function E(){const r=x(),[m,w]=p(),[i,d]=a.useState([]);a.useEffect(()=>{try{const e=localStorage.getItem("jwtToken");async function t(){let s=await c({url:l+"/suggestRooms",method:"get",headers:{Authorization:"Bearer "+e}});console.log(s.data),d(s.data)}t()}catch(e){console.log("Error in fetching active rooms",e.message)}},[]);async function u(e){try{const t=localStorage.getItem("jwtToken"),s=await c({url:l+"/roomExist",method:"post",params:{room_id:e},headers:{Authorization:"Bearer "+t}});return console.log(s.data),s.data.exist}catch(t){return console.log("Error in checking room exist : "+t.message),!1}}const g=async()=>{var e=document.getElementById("roomid").value;if(!await u(e)){f.warn("No Room exist with this id!",{position:"top-center"});return}n.set("count",0),r("./"+e)},h=()=>{var e=(Math.random()+1).toString(36).substring(7).toUpperCase();navigator.clipboard&&navigator.clipboard.writeText(e),n.set("count",0),r("./"+e+"?host=1")};return a.useEffect(()=>{let e=m.get("setToken");e&&n.set("token",e)}),o.jsx("div",{className:"flex flex-col items-center justify-center h-screen bg-gray-900 text-white",children:o.jsxs("div",{className:"bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full",children:[o.jsxs("button",{onClick:()=>r("/"),className:"my-4 p-2 py-2 rounded-lg shadow-md bg-black text-white",children:[" ",o.jsx(b,{icon:y})," Go back"]}),o.jsx("h1",{className:"text-2xl font-semibold mb-4",children:"Join or Create a Room"}),o.jsxs("div",{className:"mb-4",children:[o.jsx("label",{htmlFor:"roomid",className:"block text-gray-300 mb-2",children:"Room ID"}),o.jsx("input",{type:"text",id:"roomid",placeholder:"Enter Room ID",className:"w-full border border-gray-300 rounded-md p-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 bg-gray-700 text-white"})]}),o.jsx("button",{type:"button",onClick:g,className:"w-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-blue-300 rounded-md px-4 py-2 mb-4",children:"Join Room"}),i.length>0&&o.jsxs("div",{className:"mb-4",children:[o.jsx("h2",{className:"text-lg font-medium mb-2",children:"Active Rooms"}),o.jsx("div",{className:"space-y-2",children:i.map(e=>o.jsxs("div",{className:"flex items-center py-2",children:[o.jsx("span",{className:"mr-2 font-medium",children:o.jsx("span",{className:"cursor-pointer underline text-green-300 hover:text-white",onClick:()=>r("./"+e.roomid),children:e.roomid})}),o.jsx("span",{className:"text-gray-500 mr-2",children:"created by"}),o.jsx("span",{children:e.host})]},e.roomid))})]}),o.jsx("button",{type:"button",onClick:h,className:"w-full bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring focus:ring-purple-300 rounded-md px-4 py-2",children:"Create Room"})]})})}export{E as default};
