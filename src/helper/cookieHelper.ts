export const cookieAcceptance = "acceptedCookies";

/**
 * Check whether user has agreed to using cookies
 */
export function allowedCookies(){
  const [_name, value]=getCookie(cookieAcceptance)
  
  return value!==undefined;
}

export function getCookie(cookiename: string) {
  const cookiestring = RegExp(cookiename + "=[^;]+")
    .exec(document.cookie)
    ?.toString();

  if (!cookiestring) {
    return [];
  }
  return cookiestring.split("=");
}

export function setCookie(name:string, value:string){
  document.cookie = `${name}=${value};secure;samesite=strict`;
}
export function deleteCookie(name:string) {
  document.cookie = `${name}=${new Date().toJSON()};secure;samesite=strict;expires=${new Date(0).toUTCString()}`;
}