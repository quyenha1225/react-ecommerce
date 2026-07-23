import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../security/auth-user';

type Config = { table:string; id:string; scope:'ADMIN'|'STAFF'; permission:string; select:string[]; writable:string[]; order?:string; readonly?:boolean };
const resources: Record<string, Config> = {
  customers:{table:'users',id:'user_id',scope:'ADMIN',permission:'MANAGE_USERS',select:['user_id','user_full_name','user_email','user_phone','account_status','created_at'],writable:['user_full_name','user_email','user_phone','account_status'],order:'created_at'},
  staff:{table:'users',id:'user_id',scope:'ADMIN',permission:'MANAGE_STAFF',select:['user_id','user_full_name','user_email','user_phone','account_status','created_at'],writable:['user_full_name','user_email','user_phone','account_status'],order:'created_at'},
  products:{table:'products',id:'product_id',scope:'STAFF',permission:'MANAGE_PRODUCTS',select:['product_id','category_id','brand_id','product_name','product_slug','sku','barcode','manufacturer_part_number','release_year','origin_country','product_description','base_price','average_rating','review_count','warranty_months','product_status','created_at','updated_at'],writable:['category_id','brand_id','product_name','product_slug','sku','barcode','manufacturer_part_number','release_year','origin_country','product_description','base_price','warranty_months','product_status'],order:'created_at'},
  variants:{table:'product_variants',id:'variant_id',scope:'STAFF',permission:'MANAGE_PRODUCTS',select:['variant_id','product_id','variant_name','sku','color','ram_size','storage_size','gpu_option','cpu_option','additional_price','variant_status','is_default','created_at'],writable:['product_id','variant_name','sku','color','ram_size','storage_size','gpu_option','cpu_option','additional_price','variant_status','is_default'],order:'created_at'},
  images:{table:'product_images',id:'image_id',scope:'STAFF',permission:'MANAGE_PRODUCTS',select:['image_id','product_id','image_url','is_thumbnail','sort_order'],writable:['product_id','image_url','is_thumbnail','sort_order'],order:'sort_order'},
  attributes:{table:'product_attributes',id:'attribute_id',scope:'ADMIN',permission:'MANAGE_CATEGORIES',select:['attribute_id','attribute_name','spec_group','attribute_unit','display_order','is_highlight'],writable:['attribute_name','spec_group','attribute_unit','display_order','is_highlight'],order:'display_order'},
  orders:{table:'orders',id:'order_id',scope:'STAFF',permission:'MANAGE_ORDERS',select:['order_id','order_code','customer_id','order_status_id','order_note','order_created_at','order_updated_at'],writable:['order_status_id','order_note'],order:'order_created_at'},
  categories:{table:'categories',id:'category_id',scope:'ADMIN',permission:'MANAGE_CATEGORIES',select:['category_id','parent_category_id','category_name','category_slug','category_description','category_status','created_at'],writable:['parent_category_id','category_name','category_slug','category_description','category_status'],order:'created_at'},
  brands:{table:'brands',id:'brand_id',scope:'ADMIN',permission:'MANAGE_CATEGORIES',select:['brand_id','brand_name','brand_description','brand_status','created_at'],writable:['brand_name','brand_description','brand_status'],order:'created_at'},
  suppliers:{table:'suppliers',id:'supplier_id',scope:'STAFF',permission:'MANAGE_SUPPLIERS',select:['supplier_id','supplier_name','supplier_phone','supplier_email','supplier_address','supplier_status','created_at'],writable:['supplier_name','supplier_phone','supplier_email','supplier_address','supplier_status'],order:'created_at'},
  reviews:{table:'product_reviews',id:'review_id',scope:'STAFF',permission:'MANAGE_REVIEWS',select:['review_id','product_id','user_id','rating','review_title','review_content','review_status','created_at'],writable:['review_status'],order:'created_at'},
  payments:{table:'payments',id:'payment_id',scope:'STAFF',permission:'MANAGE_PAYMENTS',select:['payment_id','order_id','payment_method_id','payment_status_id','payment_amount','transaction_code','paid_at','created_at'],writable:['payment_status_id','transaction_code','paid_at'],order:'created_at'},
  inventory:{table:'inventory_transactions',id:'inventory_transaction_id',scope:'STAFF',permission:'MANAGE_INVENTORY',select:['inventory_transaction_id','product_id','variant_id','supplier_id','staff_user_id','inventory_type_id','transaction_quantity','unit_cost','transaction_note','transaction_at'],writable:['product_id','variant_id','supplier_id','inventory_type_id','transaction_quantity','unit_cost','transaction_note'],order:'transaction_at'},
  stock:{table:'vw_product_stock',id:'product_id',scope:'STAFF',permission:'MANAGE_INVENTORY',select:['product_id','product_name','current_stock'],writable:[],order:'product_id',readonly:true},
  'variant-stock':{table:'variant_inventory',id:'variant_id',scope:'STAFF',permission:'MANAGE_INVENTORY',select:['variant_id','stock_quantity','reserved_quantity','updated_at'],writable:['stock_quantity','reserved_quantity'],order:'updated_at'},
  'product-suppliers':{table:'product_suppliers',id:'product_id',scope:'STAFF',permission:'MANAGE_SUPPLIERS',select:['product_id','supplier_id','supplier_sku','cost_price'],writable:[],order:'product_id',readonly:true},
  'best-sellers':{table:'vw_best_selling_products',id:'product_id',scope:'STAFF',permission:'VIEW_REPORTS',select:['product_id','product_name','total_sold'],writable:[],order:'total_sold',readonly:true},
  audits:{table:'audit_logs',id:'audit_log_id',scope:'ADMIN',permission:'VIEW_AUDIT_LOGS',select:['audit_log_id','actor_user_id','action_name','affected_table_name','affected_record_id','action_description','action_at'],writable:[],order:'action_at'},
  permissions:{table:'permissions',id:'permission_id',scope:'ADMIN',permission:'MANAGE_ROLES',select:['permission_id','permission_code','permission_name','permission_description'],writable:['permission_code','permission_name','permission_description'],order:'permission_id'},
  'payment-methods':{table:'payment_methods',id:'payment_method_id',scope:'ADMIN',permission:'MANAGE_ROLES',select:['payment_method_id','payment_method_code','payment_method_name'],writable:['payment_method_code','payment_method_name'],order:'payment_method_id'},
  'order-statuses':{table:'order_statuses',id:'order_status_id',scope:'ADMIN',permission:'MANAGE_ROLES',select:['order_status_id','order_status_code','order_status_name'],writable:['order_status_code','order_status_name'],order:'order_status_id'},
  'ai-configs':{table:'ai_configs',id:'ai_config_id',scope:'ADMIN',permission:'MANAGE_ROLES',select:['ai_config_id','config_key','config_value','config_description','is_enabled','updated_at'],writable:['config_key','config_value','config_description','is_enabled'],order:'updated_at'},
};

@Injectable()
export class ManagementService {
  constructor(private readonly db: DataSource) {}

  private config(resource:string, user:AuthUser) {
    const config=resources[resource];
    if(!config) throw new NotFoundException('Unknown management resource');
    if(user.role!=='ADMIN' && user.role!==config.scope) throw new ForbiddenException(`Resource is reserved for ${config.scope}`);
    if(!user.permissions.includes(config.permission)) throw new ForbiddenException(`Missing permission: ${config.permission}`);
    return config;
  }
  private whereRole(resource:string){ return resource==='customers' ? ` WHERE role_id=(SELECT role_id FROM roles WHERE role_code='CUSTOMER') AND account_status<>'INACTIVE'` : resource==='staff' ? ` WHERE role_id=(SELECT role_id FROM roles WHERE role_code='STAFF') AND account_status<>'INACTIVE'` : ''; }
  private clean(body:any, config:Config){ return Object.fromEntries(Object.entries(body || {}).filter(([key,value])=>config.writable.includes(key)&&value!==undefined)); }

  async list(resource:string,user:AuthUser,page=1,limit=20,search=''){
    const c=this.config(resource,user); const safeLimit=Math.min(Math.max(Number(limit)||20,1),100); const safePage=Math.max(Number(page)||1,1);
    if(resource==='staff') return this.staffOverview(safePage,safeLimit,search);
    if(resource==='stock') return this.stockOverview(safePage,safeLimit,search);
    if(resource==='inventory') return this.inventoryHistory(safePage,safeLimit,search);
    if(resource==='orders') return this.orderOverview(safePage,safeLimit,search);
    if(resource==='products') return this.productOverview(safePage,safeLimit,search);
    let where=this.whereRole(resource); const params:any[]=[];
    if(search){ const searchable=c.select.filter(x=>!x.endsWith('_id')&&!x.includes('_at')); if(searchable.length){ where += where?' AND ':' WHERE '; where += `(${searchable.map(x=>`CAST(${x} AS CHAR) LIKE ?`).join(' OR ')})`; searchable.forEach(()=>params.push(`%${search}%`)); } }
    const [rows,count]=await Promise.all([
      this.db.query(`SELECT ${c.select.join(',')} FROM ${c.table}${where} ORDER BY ${c.order||c.id} DESC LIMIT ? OFFSET ?`,[...params,safeLimit,(safePage-1)*safeLimit]),
      this.db.query(`SELECT COUNT(*) total FROM ${c.table}${where}`,params),
    ]);
    return {data:rows,meta:{page:safePage,limit:safeLimit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/safeLimit)}};
  }
  private async staffOverview(page:number,limit:number,search:string){
    const filter=search?' AND (u.user_full_name LIKE ? OR u.user_email LIKE ? OR u.user_phone LIKE ?)':'';
    const params=search?Array(3).fill(`%${search}%`):[];
    const data=await this.db.query(`SELECT u.user_id,u.user_full_name,u.user_email,u.user_phone,u.account_status,u.created_at,
      COALESCE(products.products_added,0) products_added,
      COALESCE(inventory.units_imported,0) units_imported,
      COALESCE(inventory.inventory_documents,0)+COALESCE(audits.audit_actions,0) tasks_handled,
      GREATEST(COALESCE(inventory.last_inventory_at,'1970-01-01'),COALESCE(audits.last_action_at,'1970-01-01'),u.created_at) last_activity
      FROM users u JOIN roles r ON r.role_id=u.role_id AND r.role_code='STAFF'
      LEFT JOIN (SELECT created_by_user_id user_id,COUNT(*) products_added FROM products WHERE created_by_user_id IS NOT NULL GROUP BY created_by_user_id) products ON products.user_id=u.user_id
      LEFT JOIN (SELECT it.staff_user_id user_id,SUM(CASE WHEN t.inventory_type_code='IN' THEN it.transaction_quantity ELSE 0 END) units_imported,COUNT(*) inventory_documents,MAX(it.transaction_at) last_inventory_at FROM inventory_transactions it JOIN inventory_transaction_types t ON t.inventory_type_id=it.inventory_type_id GROUP BY it.staff_user_id) inventory ON inventory.user_id=u.user_id
      LEFT JOIN (SELECT actor_user_id user_id,COUNT(*) audit_actions,MAX(action_at) last_action_at FROM audit_logs GROUP BY actor_user_id) audits ON audits.user_id=u.user_id
      WHERE u.account_status<>'INACTIVE'${filter} ORDER BY last_activity DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
    const count=await this.db.query(`SELECT COUNT(*) total FROM users u JOIN roles r ON r.role_id=u.role_id AND r.role_code='STAFF' WHERE u.account_status<>'INACTIVE'${filter}`,params);
    return {data,meta:{page,limit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/limit)}};
  }
  private async productOverview(page:number,limit:number,search:string){
    const filter=search?' WHERE p.product_name LIKE ? OR p.sku LIKE ? OR c.category_name LIKE ? OR b.brand_name LIKE ?':'';
    const params=search?Array(4).fill(`%${search}%`):[];
    const from=` FROM products p JOIN categories c ON c.category_id=p.category_id LEFT JOIN brands b ON b.brand_id=p.brand_id LEFT JOIN product_images pi ON pi.product_id=p.product_id AND pi.is_thumbnail=TRUE LEFT JOIN product_variants pv ON pv.product_id=p.product_id AND pv.is_default=TRUE`;
    const data=await this.db.query(`SELECT p.product_id,p.category_id,p.brand_id,p.product_name,p.product_slug,p.sku,p.product_description,p.base_price,p.warranty_months,p.product_status,p.created_at,p.updated_at,c.category_name,b.brand_name,MAX(pi.image_url) image_url,MAX(pv.variant_name) variant_name,MAX(pv.sku) variant_sku,MAX(pv.additional_price) additional_price${from}${filter} GROUP BY p.product_id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
    const count=await this.db.query(`SELECT COUNT(DISTINCT p.product_id) total${from}${filter}`,params);
    return {data,meta:{page,limit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/limit)}};
  }
  private async orderOverview(page:number,limit:number,search:string){
    const filter=search?' WHERE o.order_code LIKE ? OR u.user_full_name LIKE ? OR u.user_email LIKE ? OR os.order_status_name LIKE ?':'';
    const params=search?Array(4).fill(`%${search}%`):[];
    const from=` FROM orders o JOIN users u ON u.user_id=o.customer_id JOIN order_statuses os ON os.order_status_id=o.order_status_id LEFT JOIN vw_order_totals ot ON ot.order_id=o.order_id LEFT JOIN payments pay ON pay.order_id=o.order_id LEFT JOIN payment_statuses ps ON ps.payment_status_id=pay.payment_status_id`;
    const data=await this.db.query(`SELECT o.order_id,o.order_code,u.user_full_name customer_name,u.user_email customer_email,o.order_status_id,os.order_status_name,COALESCE(ot.total_amount,0) total_amount,COALESCE(ps.payment_status_name,'Chưa thanh toán') payment_status_name,o.order_note,o.order_created_at,o.order_updated_at${from}${filter} ORDER BY o.order_created_at DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
    const count=await this.db.query(`SELECT COUNT(DISTINCT o.order_id) total${from}${filter}`,params);
    return {data,meta:{page,limit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/limit)}};
  }
  private async stockOverview(page:number,limit:number,search:string){ const filter=search?' WHERE p.product_name LIKE ?':''; const params=search?[`%${search}%`]:[]; const data=await this.db.query(`SELECT p.product_id,p.product_name,p.sku,COALESCE(v.current_stock,0) current_stock,COALESCE(SUM(CASE WHEN t.inventory_type_code='IN' THEN it.transaction_quantity ELSE 0 END),0) total_imported,COALESCE(SUM(CASE WHEN t.inventory_type_code='OUT' THEN it.transaction_quantity ELSE 0 END),0) total_exported,COALESCE(bs.total_sold,0) total_sold,COALESCE(SUM(CASE WHEN t.inventory_type_code='IN' THEN it.transaction_quantity*COALESCE(it.unit_cost,0) ELSE 0 END),0) import_value,CASE WHEN COALESCE(v.current_stock,0)<=0 THEN 'OUT_OF_STOCK' WHEN COALESCE(v.current_stock,0)<=5 THEN 'LOW_STOCK' WHEN COALESCE(v.current_stock,0)<=20 THEN 'NORMAL' ELSE 'HIGH_STOCK' END stock_status FROM products p LEFT JOIN vw_product_stock v ON v.product_id=p.product_id LEFT JOIN inventory_transactions it ON it.product_id=p.product_id LEFT JOIN inventory_transaction_types t ON t.inventory_type_id=it.inventory_type_id LEFT JOIN vw_best_selling_products bs ON bs.product_id=p.product_id${filter} GROUP BY p.product_id,p.product_name,p.sku,v.current_stock,bs.total_sold ORDER BY current_stock ASC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]); const count=await this.db.query(`SELECT COUNT(*) total FROM products p${filter}`,params); return {data,meta:{page,limit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/limit)}}; }
  private async inventoryHistory(page:number,limit:number,search:string){ const filter=search?' WHERE p.product_name LIKE ? OR s.supplier_name LIKE ?':''; const params=search?[`%${search}%`,`%${search}%`]:[]; const data=await this.db.query(`SELECT it.inventory_transaction_id,p.product_name,s.supplier_name,t.inventory_type_name,it.transaction_quantity,it.unit_cost,it.transaction_quantity*COALESCE(it.unit_cost,0) total_cost,it.transaction_note,it.transaction_at,u.user_full_name handled_by FROM inventory_transactions it JOIN products p ON p.product_id=it.product_id JOIN inventory_transaction_types t ON t.inventory_type_id=it.inventory_type_id LEFT JOIN suppliers s ON s.supplier_id=it.supplier_id LEFT JOIN users u ON u.user_id=it.staff_user_id${filter} ORDER BY it.transaction_at DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]); const count=await this.db.query(`SELECT COUNT(*) total FROM inventory_transactions it JOIN products p ON p.product_id=it.product_id LEFT JOIN suppliers s ON s.supplier_id=it.supplier_id${filter}`,params); return {data,meta:{page,limit,total:Number(count[0].total),pages:Math.ceil(Number(count[0].total)/limit)}}; }
  async one(resource:string,id:number,user:AuthUser){ const c=this.config(resource,user); const rows=await this.db.query(`SELECT ${c.select.join(',')} FROM ${c.table} WHERE ${c.id}=?${this.whereRole(resource).replace(' WHERE',' AND')}`,[id]); if(!rows[0]) throw new NotFoundException('Record not found'); return rows[0]; }
  async create(resource:string,body:any,user:AuthUser){ const c=this.config(resource,user); if(c.readonly) throw new BadRequestException('Resource is read only'); if(resource==='products') return this.createProduct(body,user); if(resource==='inventory') return this.createInventoryTransaction(body,user); if(resource==='staff'||resource==='customers') return this.createAccount(resource,body,user); if(['orders','payments','reviews'].includes(resource)) throw new BadRequestException('Create this record through its business workflow'); const data=this.clean(body,c); if(!Object.keys(data).length) throw new BadRequestException('No valid fields'); const keys=Object.keys(data); const result=await this.db.query(`INSERT INTO ${c.table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,Object.values(data)); await this.audit(user,`CREATE_${resource.toUpperCase()}`,c.table,result.insertId,null,data); return this.one(resource,result.insertId,user); }

  async createInventoryTransaction(body:any,user:AuthUser){
    const c=this.config('inventory',user),data:any=this.clean(body,c); data.staff_user_id=user.id;
    for(const field of ['product_id','inventory_type_id','transaction_quantity']) if(!data[field]) throw new BadRequestException(`${field} is required`);
    const quantity=Number(data.transaction_quantity); if(!Number.isInteger(quantity)||quantity<=0) throw new BadRequestException('Số lượng phải là số nguyên dương');
    const variants=await this.db.query(`SELECT variant_id FROM product_variants WHERE product_id=? AND (? IS NULL OR variant_id=?) ORDER BY is_default DESC LIMIT 1`,[data.product_id,data.variant_id||null,data.variant_id||null]);
    if(!variants[0]) throw new BadRequestException('Sản phẩm chưa có phiên bản để cập nhật tồn kho'); data.variant_id=variants[0].variant_id;
    const types=await this.db.query(`SELECT inventory_type_code FROM inventory_transaction_types WHERE inventory_type_id=?`,[data.inventory_type_id]); if(!types[0]) throw new BadRequestException('Loại giao dịch không hợp lệ');
    const isIn=['IN','RETURN'].includes(types[0].inventory_type_code),delta=isIn?quantity:-quantity;
    const runner=this.db.createQueryRunner();await runner.connect();await runner.startTransaction();
    try{
      await runner.query(`INSERT IGNORE INTO variant_inventory(variant_id,stock_quantity,reserved_quantity) VALUES(?,0,0)`,[data.variant_id]);
      if(delta<0){const rows=await runner.query(`SELECT stock_quantity FROM variant_inventory WHERE variant_id=? FOR UPDATE`,[data.variant_id]);if(Number(rows[0]?.stock_quantity||0)<quantity)throw new BadRequestException('Tồn kho không đủ để xuất');}
      const keys=Object.keys(data),result=await runner.query(`INSERT INTO inventory_transactions(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')})`,Object.values(data));
      await runner.query(`UPDATE variant_inventory SET stock_quantity=stock_quantity+? WHERE variant_id=?`,[delta,data.variant_id]);await runner.commitTransaction();
      await this.audit(user,isIn?'IMPORT_STOCK':'EXPORT_STOCK','inventory_transactions',result.insertId,null,{...data,total_cost:quantity*Number(data.unit_cost||0)});return this.one('inventory',result.insertId,user);
    }catch(error){await runner.rollbackTransaction();throw error;}finally{await runner.release();}
  }
  async update(resource:string,id:number,body:any,user:AuthUser){ const c=this.config(resource,user); if(c.readonly) throw new BadRequestException('Resource is read only'); const data=this.clean(body,c); if(resource==='products') data.updated_by_user_id=user.id; if(['staff','customers'].includes(resource)){ if(data.user_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.user_email))) throw new BadRequestException('Email không đúng định dạng'); if(data.user_phone&&!/^(0|\+84)\d{9,10}$/.test(String(data.user_phone))) throw new BadRequestException('Số điện thoại Việt Nam không hợp lệ'); if(data.account_status&&!['ACTIVE','LOCKED','INACTIVE'].includes(String(data.account_status))) throw new BadRequestException('Trạng thái tài khoản không hợp lệ'); } if(!Object.keys(data).length&&!body.images&&!body.variants) throw new BadRequestException('No valid fields'); const old=await this.one(resource,id,user); const keys=Object.keys(data); if(keys.length) try{ await this.db.query(`UPDATE ${c.table} SET ${keys.map(k=>`${k}=?`).join(',')} WHERE ${c.id}=?`,[...Object.values(data),id]); }catch(error:any){ if(error?.code==='ER_DUP_ENTRY') throw new BadRequestException('Email hoặc số điện thoại đã tồn tại'); throw error; }
    if(resource==='products'&&Array.isArray(body.images)&&body.images[0]?.image_url){ await this.db.query(`UPDATE product_images SET is_thumbnail=FALSE WHERE product_id=?`,[id]); await this.db.query(`INSERT INTO product_images(product_id,image_url,is_thumbnail,sort_order) VALUES(?,?,TRUE,1) ON DUPLICATE KEY UPDATE is_thumbnail=TRUE,sort_order=1`,[id,body.images[0].image_url]); }
    if(resource==='products'&&Array.isArray(body.variants)&&body.variants[0]){ const variant=body.variants[0]; await this.db.query(`UPDATE product_variants SET variant_name=?,sku=?,additional_price=?,variant_status='ACTIVE',is_default=TRUE WHERE product_id=? AND is_default=TRUE`,[variant.variant_name||null,variant.sku||null,Number(variant.additional_price)||0,id]); }
    await this.audit(user,`UPDATE_${resource.toUpperCase()}`,c.table,id,old,data); return resource==='products'?this.productDetail(id,user):this.one(resource,id,user); }
  async remove(resource:string,id:number,user:AuthUser){ const c=this.config(resource,user); if(c.readonly) throw new BadRequestException('Resource is read only'); const old=await this.one(resource,id,user); if(['customers','staff'].includes(resource)) await this.db.query(`UPDATE ${c.table} SET account_status='INACTIVE' WHERE ${c.id}=?`,[id]); else if(resource==='products') await this.db.query(`UPDATE products SET product_status='INACTIVE',updated_by_user_id=? WHERE product_id=?`,[user.id,id]); else await this.db.query(`DELETE FROM ${c.table} WHERE ${c.id}=?`,[id]); await this.audit(user,`DELETE_${resource.toUpperCase()}`,c.table,id,old,null); return {success:true}; }
  async createAccount(resource:'staff'|'customers',body:any,user:AuthUser){ this.config(resource,user); const name=String(body.name||body.user_full_name||'').trim(),email=String(body.email||body.user_email||'').trim().toLowerCase(),phone=String(body.phone||body.user_phone||'').trim(); if(!email||!name||!body.password) throw new BadRequestException('Vui lòng nhập đầy đủ họ tên, email và mật khẩu'); if(name.length<3||name.length>100) throw new BadRequestException('Họ tên phải có từ 3 đến 100 ký tự'); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Email không đúng định dạng'); if(phone&&!/^(0|\+84)\d{9,10}$/.test(phone)) throw new BadRequestException('Số điện thoại Việt Nam không hợp lệ'); if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(body.password)) throw new BadRequestException('Mật khẩu cần ít nhất 10 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt'); const hash=await bcrypt.hash(body.password,12); const role=resource==='staff'?'STAFF':'CUSTOMER'; try { const result=await this.db.query(`INSERT INTO users(role_id,user_full_name,user_email,user_phone,password_hash,account_status) SELECT role_id,?,?,?,?, 'ACTIVE' FROM roles WHERE role_code=?`,[name,email,phone||null,hash,role]); await this.audit(user,`CREATE_${role}`,'users',result.insertId,null,{email}); return this.one(resource,result.insertId,user); } catch { throw new BadRequestException('Email hoặc số điện thoại đã tồn tại'); } }

  async setStaffStatus(id:number,status:'ACTIVE'|'LOCKED',user:AuthUser){
    this.config('staff',user); if(!['ACTIVE','LOCKED'].includes(status)) throw new BadRequestException('Invalid status');
    const old=await this.one('staff',id,user); await this.db.query(`UPDATE users SET account_status=? WHERE user_id=?`,[status,id]);
    await this.audit(user,status==='LOCKED'?'LOCK_STAFF':'UNLOCK_STAFF','users',id,old,{account_status:status}); return this.one('staff',id,user);
  }
  async resetStaffPassword(id:number,password:string,user:AuthUser){
    this.config('staff',user); if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password||'')) throw new BadRequestException('Mật khẩu cần ít nhất 10 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt');
    await this.one('staff',id,user); const hash=await bcrypt.hash(password,12); await this.db.query(`UPDATE users SET password_hash=? WHERE user_id=?`,[hash,id]);
    await this.audit(user,'RESET_STAFF_PASSWORD','users',id,null,{password_reset:true}); return {success:true};
  }
  async createProduct(body:any,user:AuthUser){
    const c=this.config('products',user), data=this.clean(body,c); data.created_by_user_id=user.id;
    if(!data.product_slug&&data.product_name) data.product_slug=this.slugify(String(data.product_name));
    for(const required of ['category_id','product_name','product_slug','base_price']) if(data[required]===undefined||data[required]===null||data[required]==='') throw new BadRequestException(`${required} is required`);
    const runner=this.db.createQueryRunner(); await runner.connect(); await runner.startTransaction();
    try { const keys=Object.keys(data),result=await runner.query(`INSERT INTO products(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')})`,Object.values(data)); const productId=result.insertId;
      for(const image of Array.isArray(body.images)?body.images:[]) await runner.query(`INSERT INTO product_images(product_id,image_url,is_thumbnail,sort_order) VALUES(?,?,?,?)`,[productId,image.image_url,!!image.is_thumbnail,Number(image.sort_order)||0]);
      for(const variant of Array.isArray(body.variants)?body.variants:[]) await runner.query(`INSERT INTO product_variants(product_id,variant_name,sku,color,ram_size,storage_size,gpu_option,cpu_option,additional_price,variant_status,is_default) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[productId,variant.variant_name||null,variant.sku||null,variant.color||null,variant.ram_size||null,variant.storage_size||null,variant.gpu_option||null,variant.cpu_option||null,Number(variant.additional_price)||0,variant.variant_status||'ACTIVE',!!variant.is_default]);
      for(const supplier of Array.isArray(body.suppliers)?body.suppliers:[]) await runner.query(`INSERT INTO product_suppliers(product_id,supplier_id,supplier_sku,cost_price) VALUES(?,?,?,?)`,[productId,supplier.supplier_id,supplier.supplier_sku||null,supplier.cost_price??null]);
      await runner.commitTransaction(); await this.audit(user,'CREATE_PRODUCT','products',productId,null,data); return this.productDetail(productId,user);
    } catch(error){ await runner.rollbackTransaction(); throw error; } finally { await runner.release(); }
  }
  private slugify(value:string){ return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  async productDetail(id:number,user:AuthUser){ this.config('products',user); const product=await this.one('products',id,user); const [images,variants,attributes,suppliers,stock,sales]=await Promise.all([this.db.query(`SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order`,[id]),this.db.query(`SELECT pv.*,vi.stock_quantity,vi.reserved_quantity FROM product_variants pv LEFT JOIN variant_inventory vi ON vi.variant_id=pv.variant_id WHERE pv.product_id=?`,[id]),this.db.query(`SELECT pa.*,pav.attribute_value FROM product_attribute_values pav JOIN product_attributes pa ON pa.attribute_id=pav.attribute_id WHERE pav.product_id=? ORDER BY pa.display_order`,[id]),this.db.query(`SELECT ps.*,s.supplier_name FROM product_suppliers ps JOIN suppliers s ON s.supplier_id=ps.supplier_id WHERE ps.product_id=?`,[id]),this.db.query(`SELECT current_stock FROM vw_product_stock WHERE product_id=?`,[id]),this.db.query(`SELECT total_sold FROM vw_best_selling_products WHERE product_id=?`,[id])]); return {...product,images,variants,attributes,suppliers,current_stock:Number(stock[0]?.current_stock||0),total_sold:Number(sales[0]?.total_sold||0)}; }
  async dashboard(user:AuthUser){
    if(!['ADMIN','STAFF'].includes(user.role)) throw new ForbiddenException();
    const [customers,revenue,orders,profit,newCustomers,topProducts,lowStock,recentOrders,inventory,importValue,salesCost,dailySales]=await Promise.all([
      this.db.query(`SELECT COUNT(*) total FROM users u JOIN roles r ON r.role_id=u.role_id WHERE r.role_code='CUSTOMER'`),
      this.db.query(`SELECT COALESCE(SUM(p.payment_amount),0) total FROM payments p JOIN payment_statuses s ON s.payment_status_id=p.payment_status_id WHERE s.payment_status_code='PAID'`),
      this.db.query(`SELECT COUNT(*) total FROM orders`),
      this.db.query(`SELECT GREATEST(
        (SELECT COALESCE(SUM(pay.payment_amount),0) FROM payments pay JOIN payment_statuses ps ON ps.payment_status_id=pay.payment_status_id WHERE ps.payment_status_code='PAID')-
        (SELECT COALESCE(SUM(oi.ordered_quantity*COALESCE(costs.cost_price,p.base_price*0.78)),0)
         FROM payments pay JOIN payment_statuses ps ON ps.payment_status_id=pay.payment_status_id
         JOIN order_items oi ON oi.order_id=pay.order_id JOIN products p ON p.product_id=oi.product_id
         LEFT JOIN (SELECT product_id,MIN(cost_price) cost_price FROM product_suppliers GROUP BY product_id) costs ON costs.product_id=oi.product_id
         WHERE ps.payment_status_code='PAID'),0) total`),
      this.db.query(`SELECT COUNT(*) total FROM users u JOIN roles r ON r.role_id=u.role_id WHERE r.role_code='CUSTOMER' AND u.created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)`),
      this.db.query(`SELECT product_id,product_name,total_sold FROM vw_best_selling_products ORDER BY total_sold DESC LIMIT 5`),
      this.db.query(`SELECT product_id,product_name,current_stock FROM vw_product_stock WHERE current_stock<=5 ORDER BY current_stock ASC LIMIT 8`),
      this.db.query(`SELECT o.order_id,o.order_code,u.user_full_name customer,os.order_status_name,COALESCE(v.total_amount,0) total_amount,o.order_created_at FROM orders o LEFT JOIN users u ON u.user_id=o.customer_id JOIN order_statuses os ON os.order_status_id=o.order_status_id LEFT JOIN vw_order_totals v ON v.order_id=o.order_id ORDER BY o.order_created_at DESC LIMIT 6`),
      this.db.query(`SELECT COALESCE(SUM(CASE WHEN itt.inventory_type_code='IN' THEN it.transaction_quantity ELSE 0 END),0) imported,COALESCE(SUM(CASE WHEN itt.inventory_type_code='OUT' THEN it.transaction_quantity ELSE 0 END),0) exported FROM inventory_transactions it JOIN inventory_transaction_types itt ON itt.inventory_type_id=it.inventory_type_id`)
      ,this.db.query(`SELECT COALESCE(SUM(it.transaction_quantity*COALESCE(it.unit_cost,0)),0) total FROM inventory_transactions it JOIN inventory_transaction_types itt ON itt.inventory_type_id=it.inventory_type_id WHERE itt.inventory_type_code='IN'`)
      ,this.db.query(`SELECT COALESCE(SUM(oi.ordered_quantity*COALESCE(costs.cost_price,p.base_price*0.78)),0) total FROM payments pay JOIN payment_statuses ps ON ps.payment_status_id=pay.payment_status_id JOIN order_items oi ON oi.order_id=pay.order_id JOIN products p ON p.product_id=oi.product_id LEFT JOIN (SELECT product_id,MIN(cost_price) cost_price FROM product_suppliers GROUP BY product_id) costs ON costs.product_id=oi.product_id WHERE ps.payment_status_code='PAID'`)
      ,this.db.query(`SELECT DATE(o.order_created_at) label,ROUND(SUM(pay.payment_amount),0) revenue,ROUND(SUM(oi.ordered_quantity*COALESCE(costs.cost_price,p.base_price*0.78)),0) cost FROM payments pay JOIN payment_statuses ps ON ps.payment_status_id=pay.payment_status_id JOIN orders o ON o.order_id=pay.order_id JOIN order_items oi ON oi.order_id=o.order_id JOIN products p ON p.product_id=oi.product_id LEFT JOIN (SELECT product_id,MIN(cost_price) cost_price FROM product_suppliers GROUP BY product_id) costs ON costs.product_id=oi.product_id WHERE ps.payment_status_code='PAID' GROUP BY label ORDER BY label DESC LIMIT 10`)
    ]);
    const common={orders:Number(orders[0].total),topProducts,lowStock,recentOrders};
    if(user.role==='STAFF') return {...common,inventory:inventory[0]};
    return {...common,customers:Number(customers[0].total),newCustomers:Number(newCustomers[0].total),revenue:Number(revenue[0].total),profit:Number(profit[0].total),importValue:Number(importValue[0].total),salesCost:Number(salesCost[0].total),dailySales:dailySales.reverse(),inventory:inventory[0]};
  }
  async roles(user:AuthUser){ if(user.role!=='ADMIN'||!user.permissions.includes('MANAGE_ROLES')) throw new ForbiddenException(); return this.db.query(`SELECT r.role_id,r.role_code,r.role_name,r.role_description,COALESCE(JSON_ARRAYAGG(p.permission_code),JSON_ARRAY()) permissions FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.role_id LEFT JOIN permissions p ON p.permission_id=rp.permission_id GROUP BY r.role_id ORDER BY r.role_id`); }
  async updateRolePermissions(roleId:number,codes:string[],user:AuthUser){
    if(user.role!=='ADMIN'||!user.permissions.includes('MANAGE_ROLES')) throw new ForbiddenException();
    if(!Array.isArray(codes)||codes.some(code=>typeof code!=='string')) throw new BadRequestException('permissions must be an array');
    const roles=await this.db.query(`SELECT role_code FROM roles WHERE role_id=?`,[roleId]);
    if(!roles[0]) throw new NotFoundException('Role not found');
    if(roles[0].role_code==='ADMIN') throw new BadRequestException('ADMIN permissions are immutable to prevent lockout');
    const valid=await this.db.query(`SELECT permission_id,permission_code FROM permissions WHERE permission_code IN (${codes.length?codes.map(()=>'?').join(','):`''`})`,codes);
    if(valid.length!==new Set(codes).size) throw new BadRequestException('Unknown permission code');
    const runner=this.db.createQueryRunner(); await runner.connect(); await runner.startTransaction();
    try { await runner.query(`DELETE FROM role_permissions WHERE role_id=?`,[roleId]); for(const permission of valid) await runner.query(`INSERT INTO role_permissions(role_id,permission_id) VALUES(?,?)`,[roleId,permission.permission_id]); await runner.commitTransaction(); }
    catch(error){ await runner.rollbackTransaction(); throw error; } finally { await runner.release(); }
    await this.audit(user,'UPDATE_ROLE_PERMISSIONS','role_permissions',roleId,null,{permissions:codes}); return {success:true};
  }
  private async audit(user:AuthUser,action:string,table:string,id:any,oldData:any,newData:any){ const description=JSON.stringify({old:oldData,new:newData}); await this.db.query(`INSERT INTO audit_logs(actor_user_id,action_name,affected_table_name,affected_record_id,action_description) VALUES(?,?,?,?,?)`,[user.id,action,table,id||null,description]); }
}
