// Public Property Routes - 海外房产
import { Hono } from 'hono';
import { desc, eq, asc, count } from 'drizzle-orm';
import { guojia, loupan, link } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 房产列表
app.get('/property', async (c) => {
    const db = c.get('db');
    const pid = c.req.query('pid');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // 获取所有国家
    const countries = await db
        .select()
        .from(guojia)
        .orderBy(asc(guojia.sortOrder));

    // 获取房产列表和总数（只显示已发布的）
    let propertyQuery = db.select().from(loupan).where(eq(loupan.status, 1));
    let countQuery = db.select({ value: count() }).from(loupan).where(eq(loupan.status, 1));

    if (pid) {
        propertyQuery = propertyQuery.where(eq(loupan.guojiaId, parseInt(pid)));
        countQuery = countQuery.where(eq(loupan.guojiaId, parseInt(pid)));
    }

    const properties = await propertyQuery
        .orderBy(desc(loupan.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ value: totalItems }] = await countQuery;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 获取当前国家名称
    const currentCountry = pid ? countries.find(c => c.id === parseInt(pid)) : null;

    return c.html(
        <Layout title={currentCountry ? `${currentCountry.name}海外房产` : '海外房产'}>
            <div class="in_left">
                <div class="pro_title">
                    {currentCountry ? `${currentCountry.name}海外房产` : '全部海外房产'}
                </div>

                {properties.length > 0 ? (
                    <>
                        {properties.map(property => (
                            <div class="index_left_xiangmu">
                                <div class="index_left_xm_left">
                                    <a href={`/property/${property.id}`}>
                                        <img src={property.pic || '/image/gjpic.jpg'} alt={property.title || ''} />
                                    </a>
                                </div>
                                <div class="in_left_xm_right" style="float:right;width:630px">
                                    <h3 style="font-size:16px;margin-bottom:10px">
                                        <a href={`/property/${property.id}`}>{property.title}</a>
                                    </h3>
                                    <div style="color:#666;line-height:22px;margin-bottom:10px">
                                        {property.city && <span style="margin-right:15px">📍 {property.city}</span>}
                                        {property.totalPrice && <span style="margin-right:15px">💰 {property.totalPrice}</span>}
                                        {property.category && <span>🏠 {property.category}</span>}
                                    </div>
                                    {property.features && (
                                        <p style="color:#999;line-height:20px;margin-bottom:10px">
                                            ✨ {property.features}
                                        </p>
                                    )}
                                    <p style="color:#666;line-height:22px">
                                        {property.description?.substring(0, 150)}
                                        {property.description && property.description.length > 150 ? '...' : ''}
                                    </p>
                                    <p style="margin-top:10px">
                                        <a href={`/property/${property.id}`} class="pgbutton">查看详情</a>
                                    </p>
                                </div>
                                <div class="clear"></div>
                            </div>
                        ))}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl="/property"
                            queryParams={pid ? `pid=${pid}` : ''}
                        />
                    </>
                ) : (
                    <p style="padding:50px;text-align:center;color:#999">暂无房产</p>
                )}
            </div>

            <div class="in_right">
                <div class="index_right_title">选择国家</div>
                <ul class="right_class">
                    <li style={!pid ? 'background:#eee' : ''}>
                        <a href="/property">全部房产</a>
                    </li>
                    {countries.map(country => (
                        <li style={pid === String(country.id) ? 'background:#eee' : ''}>
                            <a href={`/property?pid=${country.id}`}>{country.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 房产详情
app.get('/property/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [property] = await db
        .select()
        .from(loupan)
        .where(eq(loupan.id, id))
        .limit(1);

    if (!property || property.status !== 1) {
        return c.notFound();
    }

    // 获取国家列表（用于侧边栏）
    const countries = await db
        .select()
        .from(guojia)
        .orderBy(asc(guojia.sortOrder));

    return c.html(
        <Layout title={property.title || '房产详情'}>
            <div class="in_left">
                <div class="news_title">{property.title}</div>
                <div class="news_time">
                    发布时间：{property.createdAt?.substring(0, 10)}
                </div>

                {property.pic && (
                    <div class="in_nav_pic">
                        <img src={property.pic} alt={property.title || ''} style="max-width:100%" />
                    </div>
                )}

                {/* 基本信息 */}
                <div class="in_nav" style="margin-top:20px">
                    <div class="pro_title">基本信息</div>
                    <div class="in_nav_text">
                        <table style="width:100%;border-collapse:collapse">
                            {property.city && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">所在城市：</td>
                                    <td style="padding:10px">{property.city}</td>
                                </tr>
                            )}
                            {property.totalPrice && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">总价：</td>
                                    <td style="padding:10px;color:#e74c3c;font-weight:bold">{property.totalPrice}</td>
                                </tr>
                            )}
                            {property.unitPrice && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">单价：</td>
                                    <td style="padding:10px">{property.unitPrice}</td>
                                </tr>
                            )}
                            {property.category && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">房产类别：</td>
                                    <td style="padding:10px">{property.category}</td>
                                </tr>
                            )}
                            {property.ownership && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">产权：</td>
                                    <td style="padding:10px">{property.ownership}</td>
                                </tr>
                            )}
                            {property.layout && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">户型：</td>
                                    <td style="padding:10px">{property.layout}</td>
                                </tr>
                            )}
                            {property.decoration && (
                                <tr style="border-bottom:1px solid #eee">
                                    <td style="padding:10px;width:120px;color:#666">装修：</td>
                                    <td style="padding:10px">{property.decoration}</td>
                                </tr>
                            )}
                        </table>
                    </div>
                </div>

                {/* 房产特色 */}
                {property.features && (
                    <div class="in_nav" style="margin-top:20px">
                        <div class="pro_title">房产特色</div>
                        <div class="in_nav_text">
                            <p style="line-height:24px;color:#666">{property.features}</p>
                        </div>
                    </div>
                )}

                {/* 详细介绍 */}
                {property.content && (
                    <div class="in_nav" style="margin-top:20px">
                        <div class="pro_title">详细介绍</div>
                        <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: property.content }} />
                    </div>
                )}

                <div class="news_next">
                    <a href="/property">&lt;&lt; 返回房产列表</a>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">选择国家</div>
                <ul class="right_class">
                    {countries.map(country => (
                        <li>
                            <a href={`/property?pid=${country.id}`}>{country.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

export default app;
