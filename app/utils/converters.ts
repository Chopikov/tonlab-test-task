export const convertDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDay()} ${date.toLocaleString('default',
    { month: 'long' })} ${date.getFullYear()}`;
}

export const convertUrl = (url: string) => {
  return url.replace('http', 'https')
}
