import{r as t,u as A,j as e,$ as p,B as a,a as E,b as H,s as T}from"./index-DwJcsY6s.js";import{C as F,a as R,b as q,c as B,B as m}from"./button-BUcNE2fQ.js";import{h as $,S as V,L as h,I as u}from"./react-google-recaptcha-v3.esm-BIWXyxg6.js";function I(){const[r,w]=t.useState(""),[f,j]=t.useState(""),[x,v]=t.useState(""),[o,l]=t.useState(!1),[g,y]=t.useState(null),[n,N]=t.useState(""),[C,d]=t.useState(!1),[i,b]=t.useState(!1),k=A(),P=t.useCallback(s=>{console.log("got token"),y(s)},[]),S=async()=>{if(r.trim().length==0||n.trim().length==0){a.error("Some fields are empty");return}l(!0);const s=await E({email:r,otp:n,recaptcha_token:g});s?s.success?(a.success(s.message+" , Please Login"),window.location.href="/login"):a.error(s.message):a.error("Something went wrong"),l(!1),d(c=>!c)},L=async()=>{if(r.trim().length==0&&n.trim().length===0){a.error("Some fields are empty");return}l(!0);const s=await H({email:r,otp:n,recaptcha_token:g});s?s.success?(a.success(s.message+" , Please Login"),window.location.href="/login"):a.error(s.message):a.error("Something went wrong"),l(!1),d(c=>!c)},O=async()=>{if(r.trim().length==0||f.trim().length==0||x.trim().length==0){a.error("Some fields are empty");return}l(!0);const s=await T({email:r,password:f,name:x,recaptcha_token:g});s?s.success?(b(!0),a.success(s.message+" and verify your account")):a.error(s.message):a.error("Something went wrong"),l(!1),d(c=>!c)};return t.useEffect(()=>{d(s=>!s)},[]),e.jsxs("div",{className:"min-h-screen flex justify-center items-center items-center bg-black",children:[e.jsx($,{reCaptchaKey:"6Lc9HLspAAAAAEeiv-O77afc8UopufObtkGBfuBc",children:e.jsx(V,{onVerify:P,refreshReCaptcha:C})}),e.jsxs(F,{className:"mx-auto max-w-sm m-5 backdrop-blur bg-white/25",children:[e.jsx(R,{className:"space-y-1 flex items-center justify-center",children:e.jsx(q,{className:"text-2xl font-bold text-white justify-self-center",children:i?"Cofirm Account":"Welcome !"})}),e.jsx(B,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(h,{htmlFor:"email",className:"text-white",children:"Email"}),e.jsx(u,{id:"email",value:r,onChange:s=>w(s.target.value),placeholder:"Email",required:!0,type:"email"})]}),i?e.jsx(e.Fragment,{children:e.jsxs("div",{className:"space-y-2",children:[e.jsx(h,{htmlFor:"passcode",className:"text-white",children:"OTP"}),e.jsx("div",{className:"flex gap-1",children:e.jsx(u,{placeholder:"OTP",type:"number",value:n,onChange:s=>N(s.target.value)})})]})}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(h,{htmlFor:"name",className:"text-white",children:"Name"}),e.jsx(u,{id:"name",value:x,onChange:s=>v(s.target.value),placeholder:"Name",required:!0,type:"text"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(h,{htmlFor:"password",className:"text-white",children:"Password"}),e.jsx(u,{id:"password",value:f,onChange:s=>j(s.target.value),placeholder:"Password",required:!0,type:"password"})]})]}),e.jsx(m,{className:"w-full",onClick:async()=>{i?await S():await O()},disabled:o&&!i,children:o?e.jsxs("div",{className:"flex items-center justify-center gap-3",children:["Please Wait",e.jsx(p,{visible:!0,height:"35",width:"35",color:"white",ariaLabel:"triangle-loading",wrapperClass:""})]}):e.jsx("div",{children:i?"Confirm OTP":"Create Account"})}),i&&e.jsx(m,{variant:"outline",className:"w-full",disabled:o,onClick:async()=>{await L()},children:o&&i?e.jsxs("div",{className:"flex items-center justify-center gap-3",children:["Please Wait",e.jsx(p,{visible:!0,height:"35",width:"35",color:"white",ariaLabel:"triangle-loading",wrapperClass:""})]}):"Resend OTP to Email"}),e.jsxs("div",{className:"text-white font-sm",children:["Already have account?"," ",e.jsx(m,{color:"tertiary",variant:"link",style:{color:"white"},children:e.jsx("div",{onClick:()=>window.location.href="/login",children:"Login"})})]}),e.jsxs("div",{className:"text-white font-sm",children:["Go to Home Page"," ",e.jsx(m,{color:"tertiary",variant:"link",style:{color:"white"},children:e.jsx("div",{onClick:()=>k("/"),children:"Home Page"})})]})]})})]})]})}export{I as default};
