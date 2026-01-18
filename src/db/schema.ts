// Drizzle ORM Schema for newvisas-cloud
// Based on migrated SQL Server database

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 大洲分类表
export const zhou = sqliteTable('mre_zhou', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('mre_zhou'),
    sortOrder: integer('mre_zxuhao').default(0),
});

// 国家/地区表
export const guojia = sqliteTable('mre_guojia', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('mre_guojia'),
    nameEn: text('mre_guojia2'),
    zhouId: integer('mre_zhouid'),
    sortOrder: integer('mre_gxuhao').default(0),
    flag: text('mre_gjpic'),
    videoContent: text('mre_gvcd'),
    videoPic: text('mre_gvcdpic'),
    lifeContent: text('mre_glife'),
    lifePic: text('mre_glifepic'),
    eduContent: text('mre_gedu'),
    eduPic: text('mre_gedupic'),
    housingContent: text('mre_gfang'),
    housingPic: text('mre_gfangpic'),
    coverPic: text('mre_gpic'),
    content: text('mre_gcontent'),
});

// 新闻分类表
export const newsClass = sqliteTable('mre_class', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('mre_class'),
    sortOrder: integer('mre_xuhao').default(0),
});

// 新闻资讯表
export const info = sqliteTable('mre_info', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_title'),
    keywords: text('mre_key'),
    description: text('mre_miaoshu'),
    classId: integer('mre_class'),
    content: text('mre_content'),
    createdAt: text('mre_time'),
    hits: integer('mre_hits').default(0),
    source: text('mre_laiyuan'),
    pic: text('mre_pic'),
});

// 移民项目表
export const xm = sqliteTable('mre_xm', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_xmtitle'),
    keywords: text('mre_xmkey'),
    description: text('mre_xmmiaoshu'),
    zhouId: integer('mre_xmzhou'),
    guojiaId: integer('mre_xmguojia'),
    content: text('mre_xmcontent'),
    advantages: text('mre_xmyoushi'),
    process: text('mre_xmliucheng'),
    conditions: text('mre_xmtiaojian'),
    pic: text('mre_xmpic'),
    createdAt: text('mre_xmtime'),
    hits: integer('mre_xmhits').default(0),
});

// 成功案例表
export const anli = sqliteTable('mre_anli', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_altitle'),
    keywords: text('mre_alkey'),
    description: text('mre_almiaoshu'),
    guojiaId: integer('mre_alguojia'),
    content: text('mre_alcontent'),
    createdAt: text('mre_altime'),
    hits: integer('mre_alhits').default(0),
    pic: text('mre_alpic'),
});

// 讲座活动表
export const jiangzuo = sqliteTable('mre_jiangzuo', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_jztitle'),
    time: text('mre_jzshijian'),
    address: text('mre_jzdizhi'),
    keywords: text('mre_jzkey'),
    description: text('mre_jzmiaoshu'),
    guojia: text('mre_jzguojia'),
    content: text('mre_jzcontent'),
    createdAt: text('mre_jztime'),
    hits: integer('mre_jzhits').default(0),
    pic: text('mre_jzpic'),
});

// 海外房产表
export const loupan = sqliteTable('mre_loupan', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_lptitle'),
    zhouId: integer('mre_lpzhou'),
    guojiaId: integer('mre_lpguojia'),
    city: text('mre_lpcity'),
    features: text('mre_lptese'),
    keywords: text('mre_lpkey'),
    description: text('mre_lpmiaoshu'),
    pic: text('mre_lppic'),
    totalPrice: text('mre_lpzongjia'),
    unitPrice: text('mre_lpjiage'),
    category: text('mre_lpleibie'),
    ownership: text('mre_lpchanquan'),
    layout: text('mre_lphuxing'),
    decoration: text('mre_lpzhuangxiu'),
    content: text('mre_lpcontent'),
    createdAt: text('mre_lptime'),
    hits: integer('mre_lphits').default(0),
    status: integer('mre_lpzt').default(1),
});

// 评估申请表
export const pinggu = sqliteTable('mre_pinggu', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('mre_pgxingming'),
    gender: text('mre_pgsex'),
    phone: text('mre_pgtel'),
    phone2: text('mre_pgtel2'),
    birthday: text('mre_pgbrith'),
    email: text('mre_pgmail'),
    targetCountry: text('mre_pgguojia'),
    targetCountry2: text('mre_pgguojia2'),
    intention: text('mre_pgyiyuan'),
    callbackTime: text('mre_pghuidian'),
    budget: text('mre_pgmoney'),
    english: text('mre_pgenglish'),
    legalPerson: text('mre_pgfaren'),
    shareholder: text('mre_pggudong'),
    position: text('mre_pgzhiwu'),
    company: text('mre_pgqiye'),
    referral: text('mre_pgbook'),
    createdAt: text('mre_pgtime'),
    status: integer('mre_pgzt').default(0),
    processedAt: text('mre_pgzttime'),
});

// 团队成员表
export const team = sqliteTable('mre_team', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('mre_tdtitle'),
    title: text('mre_tdzhiwu'),
    pic: text('mre_tdpic'),
    content: text('mre_tdcontent'),
    keywords: text('mre_tdkey'),
    description: text('mre_tdmiaoshu'),
    createdAt: text('mre_tdtime'),
    hits: integer('mre_tdhits').default(0),
    sortOrder: integer('mre_tdxuhao').default(0),
    qq: text('mre_tdqq'),
    customField: text('mre_tdcus'),
});

// 广告表
export const ad = sqliteTable('mre_ad', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_adtitle'),
    url: text('mre_adurl'),
    pic: text('mre_adpic'),
    status: integer('mre_adzt').default(1),
    createdAt: text('mre_adtime'),
});

// 友情链接表
export const link = sqliteTable('mre_link', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('mre_linktitle'),
    url: text('mre_linkurl'),
    createdAt: text('mre_linktime'),
});

// 管理员表
export const user = sqliteTable('mre_user', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('mre_user'),
    password: text('mre_mima'),
    createdAt: text('mre_time'),
    loginCount: integer('mre_num').default(0),
});

// QQ访客记录表
export const qqhaoma = sqliteTable('mre_qqhaoma', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    qqNum: text('qqnum'),
    ip: text('qqip'),
    visitTime: text('qqtime'),
    url: text('qqurl'),
});
