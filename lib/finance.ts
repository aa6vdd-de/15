export const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
export const CATEGORIES = ['عصائر طازجة','خلطات وكوكتيل','مشروبات خاصة','حلى وإضافات','أخرى'];
export const EXPENSE_CATEGORIES = ['إيجار','رواتب','كهرباء','مياه','إنترنت واتصالات','صيانة','تسويق','توصيل ونقل','رسوم واشتراكات','هدر مواد','أخرى'];
export type Sale = { id:string; date:string; product:string; category:string; qty:number; revenue:number; cost:number; notes:string; version:number };
export type Expense = { id:string; date:string; title:string; category:string; type:'fixed'|'variable'; amount:number; notes:string; version:number };
export type FinanceData = { sales:Sale[]; expenses:Expense[] };
export type View = 'overview'|'revenue'|'expenses'|'entry';
export const number = (value:number, digits=0) => new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(value);
export const money = (cents:number) => number(cents/100,2);
export const percent = (profit:number,revenue:number) => revenue>0 ? profit/revenue*100 : null;
export const monthOf = (date:string) => Number(date.slice(5,7))-1;
export const filterMonth = <T extends {date:string}>(rows:T[],month:string) => month==='all' ? rows : rows.filter(r=>monthOf(r.date)===Number(month));
export function summarize(data:FinanceData) {
  const revenue=data.sales.reduce((s,r)=>s+r.revenue,0), direct=data.sales.reduce((s,r)=>s+r.cost,0);
  const fixed=data.expenses.filter(r=>r.type==='fixed').reduce((s,r)=>s+r.amount,0),variable=data.expenses.filter(r=>r.type==='variable').reduce((s,r)=>s+r.amount,0);
  const totalCost=direct+fixed+variable,profit=revenue-totalCost,qty=data.sales.reduce((s,r)=>s+r.qty,0);
  return {revenue,direct,fixed,variable,totalCost,profit,qty,gross:revenue-direct,margin:percent(profit,revenue),records:data.sales.length+data.expenses.length};
}
export function monthly(data:FinanceData) {return MONTHS.map((name,i)=>({name,index:i,...summarize({sales:filterMonth(data.sales,String(i)),expenses:filterMonth(data.expenses,String(i))})}));}
export function groupProducts(sales:Sale[]) {
  const groups=new Map<string,{product:string;category:string;qty:number;revenue:number;cost:number;profit:number;margin:number|null}>();
  sales.forEach(s=>{const key=JSON.stringify([s.product,s.category]);const row=groups.get(key)||{product:s.product,category:s.category,qty:0,revenue:0,cost:0,profit:0,margin:null};row.qty+=s.qty;row.revenue+=s.revenue;row.cost+=s.cost;row.profit=row.revenue-row.cost;row.margin=percent(row.profit,row.revenue);groups.set(key,row)});
  return [...groups.values()].sort((a,b)=>b.revenue-a.revenue);
}
export function groupAmounts(rows:{category:string;amount:number}[]) {
  const groups=new Map<string,number>();rows.forEach(r=>groups.set(r.category,(groups.get(r.category)||0)+r.amount));
  return [...groups].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}
export function demoData():FinanceData {
  const base=[['مانجو','عصائر طازجة',1400,1600,520],['برتقال','عصائر طازجة',1500,1200,310],['فراولة','عصائر طازجة',1100,1500,480],['أفوكادو','مشروبات خاصة',800,2000,890],['كوكتيل','خلطات وكوكتيل',700,1800,520],['ليمون ونعناع','عصائر طازجة',500,900,202]] as const;
  const seasons=[.62,.68,.82,.95,1.04,1.25,1.43,1.38,1.16,.95,.80,.71],electricity=[1100,1150,1300,1600,2100,2800,3400,3250,2600,1800,1300,1150];
  const sales:Sale[]=[],expenses:Expense[]=[];
  seasons.forEach((season,m)=>{const month=String(m+1).padStart(2,'0');
    base.forEach(([product,category,qty,price,cost],i)=>{const sold=Math.round(qty*season*(1+Math.sin(m+i)*.07));sales.push({id:`demo-sale-${m}-${i}`,date:`2026-${month}-15`,product,category,qty:sold,revenue:sold*price,cost:sold*Math.round(cost*(1+(m%3)*.015)),notes:'ملخص شهري افتراضي',version:1})});
    const items:[string,Expense['type'],number][]=[['إيجار','fixed',9000],['رواتب','fixed',18000],['إنترنت واتصالات','fixed',450],['كهرباء','variable',electricity[m]],['مياه','variable',Math.round(420*season)],['صيانة','variable',m===5||m===8?1900:450],['تسويق','variable',m>=4&&m<=7?2000:900],['هدر مواد','variable',Math.round(1800*season)]];
    items.forEach(([category,type,amount],i)=>expenses.push({id:`demo-expense-${m}-${i}`,date:`2026-${month}-01`,title:category,category,type,amount:amount*100,notes:'مصروف افتراضي',version:1}));
  });return {sales,expenses};
}
export class InputError extends Error {}
function textValue(value:unknown,label:string,max=120) {if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new InputError(`تحقق من ${label} (بحد أقصى ${max} حرفًا).`);return value.trim()}
export function date2026(value:unknown) {if(typeof value!=='string'||!/^2026-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new InputError('أدخل تاريخًا صحيحًا ضمن سنة 2026.');return value}
function cents(value:unknown,label:string) {if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0||value>100000000000)throw new InputError(`أدخل قيمة صحيحة لـ${label}.`);return value}
export function validateId(value:unknown) {if(typeof value!=='string'||!/^[a-f0-9-]{36}(?:-\d{2})?$/.test(value))throw new InputError('معرّف السجل غير صحيح.');return value}
export function validateVersion(value:unknown) {if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new InputError('إصدار السجل غير صحيح. حدّث الصفحة.');return value}
export function validateSale(raw:Record<string,unknown>) {
  const qty=raw.qty;if(typeof qty!=='number'||!Number.isSafeInteger(qty)||qty<1||qty>10000000)throw new InputError('الكمية يجب أن تكون عددًا صحيحًا موجبًا.');
  return {id:validateId(raw.id),date:date2026(raw.date),product:textValue(raw.product,'اسم المنتج'),category:textValue(raw.category,'تصنيف المنتج'),qty,revenue:cents(raw.revenue,'الإيراد'),cost:cents(raw.cost,'تكلفة المنتج'),notes:typeof raw.notes==='string'?raw.notes.trim().slice(0,500):''};
}
export function validateExpense(raw:Record<string,unknown>) {
  if(raw.type!=='fixed'&&raw.type!=='variable')throw new InputError('حدد نوع المصروف.');
  return {id:validateId(raw.id),date:date2026(raw.date),title:textValue(raw.title,'اسم المصروف'),category:textValue(raw.category,'بند المصروف'),type:raw.type,amount:cents(raw.amount,'قيمة المصروف'),notes:typeof raw.notes==='string'?raw.notes.trim().slice(0,500):''};
}
export function expandExpense(raw:Record<string,unknown>) {
  const expense=validateExpense(raw);if(raw.repeatEnd===undefined||raw.repeatEnd===null||raw.repeatEnd==='')return [expense];
  const start=monthOf(expense.date),end=raw.repeatEnd;if(typeof end!=='number'||!Number.isInteger(end)||end<start||end>11)throw new InputError('نهاية التكرار يجب أن تكون بعد شهر البداية أو مساوية له، ضمن 2026.');
  return Array.from({length:end-start+1},(_,i)=>{const month=start+i,day=Math.min(Number(expense.date.slice(8)),new Date(Date.UTC(2026,month+1,0)).getUTCDate());return {...expense,id:`${expense.id}-${String(month+1).padStart(2,'0')}`,date:`2026-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`}});
}
