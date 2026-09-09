import { financeDb } from '@/db/finance';
import { InputError, validateId, validateSale, validateExpense, expandExpense, validateVersion } from '@/lib/finance';
const headers={'Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
function safeOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new InputError('تعذر التحقق من مصدر الطلب. أعد فتح الموقع.');}
async function body(request:Request){if(!request.headers.get('content-type')?.includes('application/json'))throw new InputError('صيغة الطلب غير صحيحة.');const text=await request.text();if(text.length>12000)throw new InputError('حجم السجل أكبر من المسموح.');const parsed=JSON.parse(text);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new InputError('بيانات السجل غير صحيحة.');return parsed as Record<string,unknown>}
function failure(error:unknown){if(error instanceof InputError||error instanceof SyntaxError)return json({error:error instanceof SyntaxError?'صيغة البيانات غير صحيحة.':error.message},400);console.error('Finance data operation failed',error);return json({error:'تعذر الوصول إلى البيانات الآن. لم يتم تأكيد الحفظ؛ احتفظ بالإدخال وأعد المحاولة.'},503)}
export async function GET(){try{const db=financeDb();const result=await db.batch([db.prepare('SELECT id,date,product,category,qty,revenue,cost,notes,version FROM sales WHERE date >= ? AND date < ? ORDER BY date DESC,created_at DESC').bind('2026-01-01','2027-01-01'),db.prepare('SELECT id,date,title,category,type,amount,notes,version FROM expenses WHERE date >= ? AND date < ? ORDER BY date DESC,created_at DESC').bind('2026-01-01','2027-01-01')]);return json({sales:result[0].results,expenses:result[1].results})}catch(error){return failure(error)}}
export async function POST(request:Request){try{safeOrigin(request);const raw=await body(request),db=financeDb(),now=new Date().toISOString();
 if(raw.kind==='sale'){const s=validateSale(raw);await db.prepare('INSERT INTO sales (id,date,product,category,qty,revenue,cost,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(s.id,s.date,s.product,s.category,s.qty,s.revenue,s.cost,s.notes,now).run();return json({ok:true,count:1},201)}
 if(raw.kind==='expense'){const rows=expandExpense(raw);await db.batch(rows.map(e=>db.prepare('INSERT INTO expenses (id,date,title,category,type,amount,notes,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(e.id,e.date,e.title,e.category,e.type,e.amount,e.notes,now)));return json({ok:true,count:rows.length},201)}
 throw new InputError('نوع السجل غير صحيح.');
}catch(error){return failure(error)}}
export async function PUT(request:Request){try{safeOrigin(request);const raw=await body(request),db=financeDb(),version=validateVersion(raw.version);let result;
 if(raw.kind==='sale'){const s=validateSale(raw);result=await db.prepare('UPDATE sales SET date=?,product=?,category=?,qty=?,revenue=?,cost=?,notes=?,version=version+1 WHERE id=? AND version=?').bind(s.date,s.product,s.category,s.qty,s.revenue,s.cost,s.notes,s.id,version).run()}
 else if(raw.kind==='expense'){const e=validateExpense(raw);result=await db.prepare('UPDATE expenses SET date=?,title=?,category=?,type=?,amount=?,notes=?,version=version+1 WHERE id=? AND version=?').bind(e.date,e.title,e.category,e.type,e.amount,e.notes,e.id,version).run()}
 else throw new InputError('نوع السجل غير صحيح.');
 if(!result.meta.changes)return json({error:'تم تعديل هذا السجل أو حذفه من نافذة أخرى. حدّث البيانات ثم أعد فتحه.'},409);return json({ok:true});
}catch(error){return failure(error)}}
export async function DELETE(request:Request){try{safeOrigin(request);const raw=await body(request),id=validateId(raw.id),version=validateVersion(raw.version),db=financeDb();
 const query=raw.kind==='sale'?'DELETE FROM sales WHERE id=? AND version=?':raw.kind==='expense'?'DELETE FROM expenses WHERE id=? AND version=?':null;
 if(!query)throw new InputError('نوع السجل غير صحيح.');const result=await db.prepare(query).bind(id,version).run();if(!result.meta.changes)return json({error:'تغيّر السجل منذ فتحه. حدّث البيانات قبل الحذف.'},409);return json({ok:true});
}catch(error){return failure(error)}}
