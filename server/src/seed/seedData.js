import { getDb, initSchema, saveDb } from '../database/init.js';

const R = { 老师: 1, 学生: 2, 父亲: 3, 母亲: 4, 丈夫: 5, 妻子: 6, 小妾: 7, 情人: 8, 兄弟: 9, 朋友: 10, 政敌: 11, 同事: 12 };

const celebrities = [
  // ══════════ 中国 — 春秋 (20 位) ══════════
  { name: 'Confucius', chinese_name: '孔子', his_id: 'chunqiu_804532', birth_date: '公元前551年', death_date: '公元前479年', nationality: '中国', occupation: '哲学家、教育家', biography: '儒家学派创始人，中国古代最伟大的思想家、教育家。' },
  { name: 'Yan Hui', chinese_name: '颜回', his_id: 'chunqiu_671209', birth_date: '公元前521年', death_date: '公元前481年', nationality: '中国', occupation: '哲学家', biography: '孔子最得意的弟子，以德行著称，被尊为"复圣"。' },
  { name: 'Zi Lu', chinese_name: '子路', his_id: 'chunqiu_435876', birth_date: '公元前542年', death_date: '公元前480年', nationality: '中国', occupation: '政治家', biography: '孔子弟子，以勇武直率著称，曾任卫国大夫。' },
  { name: 'Laozi', chinese_name: '老子', his_id: 'chunqiu_190283', birth_date: '约公元前571年', death_date: '约公元前471年', nationality: '中国', occupation: '哲学家', biography: '道家学派创始人，《道德经》作者。' },
  { name: 'Sun Wu', chinese_name: '孙武', his_id: 'chunqiu_547261', birth_date: '约公元前545年', death_date: '约公元前470年', nationality: '中国', occupation: '军事家', biography: '《孙子兵法》作者，被誉为"兵圣"。' },
  { name: 'Guan Zhong', chinese_name: '管仲', his_id: 'chunqiu_386729', birth_date: '约公元前723年', death_date: '公元前645年', nationality: '中国', occupation: '政治家', biography: '春秋时期著名政治家，辅佐齐桓公称霸。' },
  { name: 'Bao Shuya', chinese_name: '鲍叔牙', his_id: 'chunqiu_615843', birth_date: '约公元前723年', death_date: '公元前644年', nationality: '中国', occupation: '政治家', biography: '春秋时期齐国大夫，管仲挚友，以知人善荐著称。' },
  { name: 'Duke Huan of Qi', chinese_name: '齐桓公', his_id: 'chunqiu_472958', birth_date: '约公元前716年', death_date: '公元前643年', nationality: '中国', occupation: '君主', biography: '春秋五霸之首，任用管仲进行改革。' },
  { name: 'Duke Wen of Jin', chinese_name: '晋文公', his_id: 'chunqiu_831546', birth_date: '约公元前697年', death_date: '公元前628年', nationality: '中国', occupation: '君主', biography: '春秋五霸之一，晋国国君。' },
  { name: 'King Zhuang of Chu', chinese_name: '楚庄王', his_id: 'chunqiu_724159', birth_date: '约公元前613年', death_date: '公元前591年', nationality: '中国', occupation: '君主', biography: '春秋五霸之一，"一鸣惊人"典故主人公。' },
  { name: 'Duke Mu of Qin', chinese_name: '秦穆公', his_id: 'chunqiu_365812', birth_date: '约公元前682年', death_date: '公元前621年', nationality: '中国', occupation: '君主', biography: '春秋五霸之一，秦国的奠基者。' },
  { name: 'Yan Ying', chinese_name: '晏婴', his_id: 'chunqiu_528314', birth_date: '公元前578年', death_date: '公元前500年', nationality: '中国', occupation: '政治家', biography: '春秋齐国大夫，以智慧善辩著称，"晏子使楚"典故主人公。' },
  { name: 'Wu Zixu', chinese_name: '伍子胥', his_id: 'chunqiu_639147', birth_date: '公元前559年', death_date: '公元前484年', nationality: '中国', occupation: '军事家、政治家', biography: '春秋吴国大夫，助吴王阖闾称霸。' },
  { name: 'Gou Jian', chinese_name: '勾践', his_id: 'chunqiu_285934', birth_date: '约公元前520年', death_date: '公元前465年', nationality: '中国', occupation: '君主', biography: '越王，"卧薪尝胆"典故主人公。' },
  { name: 'Fu Chai', chinese_name: '夫差', his_id: 'chunqiu_701462', birth_date: '约公元前528年', death_date: '公元前473年', nationality: '中国', occupation: '君主', biography: '吴王，与越王勾践争霸。' },
  { name: 'Fan Li', chinese_name: '范蠡', his_id: 'chunqiu_476183', birth_date: '公元前536年', death_date: '公元前448年', nationality: '中国', occupation: '政治家、商人', biography: '越国谋臣，助勾践灭吴后经商成为巨富。' },
  { name: 'Xi Shi', chinese_name: '西施', his_id: 'chunqiu_832507', birth_date: '约公元前506年', death_date: '约公元前450年', nationality: '中国', occupation: '美人', biography: '中国古代四大美女之首，越王勾践献给吴王夫差的美人。' },
  { name: 'Jie Zitui', chinese_name: '介子推', his_id: 'chunqiu_149265', birth_date: '约公元前655年', death_date: '约公元前636年', nationality: '中国', occupation: '隐士', biography: '春秋时期晋国贤臣，寒食节纪念的人物。' },
  { name: 'Bo Pi', chinese_name: '伯嚭', his_id: 'chunqiu_903478', birth_date: '约公元前520年', death_date: '公元前473年', nationality: '中国', occupation: '官员', biography: '吴国太宰，被越国收买，导致吴国灭亡。' },
  { name: 'Baili Xi', chinese_name: '百里奚', his_id: 'chunqiu_256741', birth_date: '约公元前725年', death_date: '约公元前621年', nationality: '中国', occupation: '政治家', biography: '秦国大夫，辅佐秦穆公称霸西戎。' },

  // ══════════ 中国 — 战国 (20 位) ══════════
  { name: 'Mencius', chinese_name: '孟子', his_id: 'zhanguo_384721', birth_date: '约公元前372年', death_date: '公元前289年', nationality: '中国', occupation: '哲学家', biography: '儒家代表人物，被尊为"亚圣"。' },
  { name: 'Zhuangzi', chinese_name: '庄子', his_id: 'zhanguo_659213', birth_date: '约公元前369年', death_date: '公元前286年', nationality: '中国', occupation: '哲学家', biography: '道家代表人物，《庄子》作者。' },
  { name: 'Xunzi', chinese_name: '荀子', his_id: 'zhanguo_172846', birth_date: '约公元前313年', death_date: '公元前238年', nationality: '中国', occupation: '哲学家', biography: '儒家代表人物，提出"性恶论"，韩非、李斯之师。' },
  { name: 'Mozi', chinese_name: '墨子', his_id: 'zhanguo_821534', birth_date: '约公元前468年', death_date: '公元前376年', nationality: '中国', occupation: '哲学家', biography: '墨家学派创始人，提出"兼爱非攻"。' },
  { name: 'Han Feizi', chinese_name: '韩非子', his_id: 'zhanguo_493856', birth_date: '约公元前280年', death_date: '公元前233年', nationality: '中国', occupation: '哲学家', biography: '法家代表人物，荀子学生，著作《韩非子》。' },
  { name: 'Qu Yuan', chinese_name: '屈原', his_id: 'zhanguo_568214', birth_date: '约公元前340年', death_date: '公元前278年', nationality: '中国', occupation: '诗人', biography: '战国楚国诗人，《楚辞》代表，端午节纪念人物。' },
  { name: 'Lian Po', chinese_name: '廉颇', his_id: 'zhanguo_723419', birth_date: '约公元前327年', death_date: '公元前243年', nationality: '中国', occupation: '将领', biography: '战国赵国名将，"负荆请罪"典故主人公。' },
  { name: 'Lin Xiangru', chinese_name: '蔺相如', his_id: 'zhanguo_457682', birth_date: '约公元前329年', death_date: '公元前259年', nationality: '中国', occupation: '政治家', biography: '战国赵国上卿，"完璧归赵"典故主人公。' },
  { name: 'Bai Qi', chinese_name: '白起', his_id: 'zhanguo_835291', birth_date: '约公元前332年', death_date: '公元前257年', nationality: '中国', occupation: '将领', biography: '战国秦国名将，号称"人屠"，长平之战主帅。' },
  { name: 'Wang Jian', chinese_name: '王翦', his_id: 'zhanguo_674138', birth_date: '约公元前310年', death_date: '公元前220年', nationality: '中国', occupation: '将领', biography: '战国秦国名将，助秦始皇统一六国。' },
  { name: 'Sun Bin', chinese_name: '孙膑', his_id: 'zhanguo_918263', birth_date: '约公元前380年', death_date: '公元前316年', nationality: '中国', occupation: '军事家', biography: '战国齐国军事家，孙武后代，《孙膑兵法》作者。' },
  { name: 'Pang Juan', chinese_name: '庞涓', his_id: 'zhanguo_345789', birth_date: '约公元前385年', death_date: '公元前342年', nationality: '中国', occupation: '将领', biography: '战国魏国名将，与孙膑同门相残。' },
  { name: 'Su Qin', chinese_name: '苏秦', his_id: 'zhanguo_726581', birth_date: '约公元前380年', death_date: '公元前284年', nationality: '中国', occupation: '纵横家', biography: '战国纵横家，合纵抗秦的倡导者。' },
  { name: 'Zhang Yi', chinese_name: '张仪', his_id: 'zhanguo_419367', birth_date: '约公元前378年', death_date: '公元前309年', nationality: '中国', occupation: '纵横家', biography: '战国纵横家，连横破合纵的倡导者。' },
  { name: 'Lord Xinling', chinese_name: '信陵君', his_id: 'zhanguo_582946', birth_date: '约公元前315年', death_date: '公元前243年', nationality: '中国', occupation: '政治家', biography: '战国四公子之一，窃符救赵的策划者。' },
  { name: 'Lord Mengchang', chinese_name: '孟尝君', his_id: 'zhanguo_134297', birth_date: '约公元前350年', death_date: '公元前279年', nationality: '中国', occupation: '政治家', biography: '战国四公子之一，以养士三千闻名。' },
  { name: 'Lord Pingyuan', chinese_name: '平原君', his_id: 'zhanguo_675481', birth_date: '约公元前308年', death_date: '公元前251年', nationality: '中国', occupation: '政治家', biography: '战国四公子之一，赵国公子。' },
  { name: 'Lord Chunshen', chinese_name: '春申君', his_id: 'zhanguo_289413', birth_date: '约公元前314年', death_date: '公元前238年', nationality: '中国', occupation: '政治家', biography: '战国四公子之一，楚国令尹。' },
  { name: 'Jing Ke', chinese_name: '荆轲', his_id: 'zhanguo_756824', birth_date: '约公元前250年', death_date: '公元前227年', nationality: '中国', occupation: '刺客', biography: '战国刺客，"图穷匕见"典故主人公，刺秦未遂。' },
  { name: 'Li Si', chinese_name: '李斯', his_id: 'zhanguo_623571', birth_date: '约公元前284年', death_date: '公元前208年', nationality: '中国', occupation: '政治家', biography: '秦朝丞相，辅佐秦始皇统一六国，荀子学生。' },

  // ══════════ 中国 — 历朝历代 (10 位) ══════════
  { name: 'Qin Shi Huang', chinese_name: '秦始皇', his_id: 'qin_590321', birth_date: '公元前259年', death_date: '公元前210年', nationality: '中国', occupation: '皇帝', biography: '中国第一个皇帝，统一六国，建立秦朝。' },
  { name: 'Xiang Yu', chinese_name: '项羽', his_id: 'qin_867234', birth_date: '公元前232年', death_date: '公元前202年', nationality: '中国', occupation: '将领', biography: '西楚霸王，秦末起义军领袖，与刘邦争夺天下。' },
  { name: 'Liu Bang', chinese_name: '刘邦', his_id: 'xihan_412689', birth_date: '公元前256年', death_date: '公元前195年', nationality: '中国', occupation: '皇帝', biography: '汉朝开国皇帝，汉高祖。' },
  { name: 'Sima Qian', chinese_name: '司马迁', his_id: 'xihan_735102', birth_date: '约公元前145年', death_date: '约公元前86年', nationality: '中国', occupation: '史学家', biography: '《史记》作者，中国史学之父。' },
  { name: 'Cao Cao', chinese_name: '曹操', his_id: 'sanguo_548396', birth_date: '155年', death_date: '220年', nationality: '中国', occupation: '政治家、军事家', biography: '东汉末年政治家、军事家、文学家，魏武帝。' },
  { name: 'Zhuge Liang', chinese_name: '诸葛亮', his_id: 'sanguo_621784', birth_date: '181年', death_date: '234年', nationality: '中国', occupation: '政治家、军事家', biography: '三国蜀汉丞相，"鞠躬尽瘁"的典范。' },
  { name: 'Li Shimin', chinese_name: '李世民', his_id: 'tang_783209', birth_date: '598年', death_date: '649年', nationality: '中国', occupation: '皇帝', biography: '唐太宗，开创"贞观之治"。' },
  { name: 'Yue Fei', chinese_name: '岳飞', his_id: 'nansong_516847', birth_date: '1103年', death_date: '1142年', nationality: '中国', occupation: '将领', biography: '南宋抗金名将，被秦桧以"莫须有"罪名陷害。' },
  { name: 'Zheng He', chinese_name: '郑和', his_id: 'ming_294685', birth_date: '1371年', death_date: '1433年', nationality: '中国', occupation: '航海家', biography: '明代航海家，七下西洋。' },
  { name: 'Kangxi', chinese_name: '康熙帝', his_id: 'qing_371568', birth_date: '1654年', death_date: '1722年', nationality: '中国', occupation: '皇帝', biography: '清朝第四位皇帝，开创"康乾盛世"。' },

  // ══════════ 国外 — 数学家、物理学家 (30 位) ══════════
  { name: 'Archimedes', chinese_name: '阿基米德', his_id: 'F_510237', birth_date: '约公元前287年', death_date: '公元前212年', nationality: '古希腊', occupation: '数学家、物理学家', biography: '古希腊伟大的数学家、物理学家，阿基米德原理发现者。' },
  { name: 'Nicolaus Copernicus', chinese_name: '哥白尼', his_id: 'F_689345', birth_date: '1473-02-19', death_date: '1543-05-24', nationality: '波兰', occupation: '天文学家', biography: '日心说创始人，近代天文学奠基人。' },
  { name: 'Galileo Galilei', chinese_name: '伽利略', his_id: 'F_472831', birth_date: '1564-02-15', death_date: '1642-01-08', nationality: '意大利', occupation: '天文学家、物理学家', biography: '近代科学之父，天文观测和力学研究的先驱。' },
  { name: 'Johannes Kepler', chinese_name: '开普勒', his_id: 'F_826593', birth_date: '1571-12-27', death_date: '1630-11-15', nationality: '德国', occupation: '天文学家', biography: '发现行星运动三大定律，为牛顿万有引力奠基。' },
  { name: 'René Descartes', chinese_name: '笛卡尔', his_id: 'F_391478', birth_date: '1596-03-31', death_date: '1650-02-11', nationality: '法国', occupation: '数学家、哲学家', biography: '解析几何创始人，"我思故我在"。' },
  { name: 'Pierre de Fermat', chinese_name: '费马', his_id: 'F_547832', birth_date: '1607-10-31', death_date: '1665-01-12', nationality: '法国', occupation: '数学家', biography: '数论奠基人，费马大定理提出者。' },
  { name: 'Blaise Pascal', chinese_name: '帕斯卡', his_id: 'F_283691', birth_date: '1623-06-19', death_date: '1662-08-19', nationality: '法国', occupation: '数学家、物理学家', biography: '概率论奠基人，帕斯卡定律发现者。' },
  { name: 'Isaac Newton', chinese_name: '艾萨克·牛顿', his_id: 'F_714562', birth_date: '1643-01-04', death_date: '1727-03-31', nationality: '英国', occupation: '物理学家、数学家', biography: '万有引力定律和三大运动定律提出者，经典物理学奠基人。' },
  { name: 'Gottfried Leibniz', chinese_name: '莱布尼茨', his_id: 'F_802647', birth_date: '1646-07-01', death_date: '1716-11-14', nationality: '德国', occupation: '数学家、哲学家', biography: '微积分创始人之一，二进制发明者。' },
  { name: 'Leonhard Euler', chinese_name: '欧拉', his_id: 'F_463829', birth_date: '1707-04-15', death_date: '1783-09-18', nationality: '瑞士', occupation: '数学家', biography: '史上最多产的数学家，欧拉公式提出者。' },
  { name: 'Joseph-Louis Lagrange', chinese_name: '拉格朗日', his_id: 'F_587316', birth_date: '1736-01-25', death_date: '1813-04-10', nationality: '意大利/法国', occupation: '数学家', biography: '变分法奠基人，拉格朗日力学创立者。' },
  { name: 'Pierre-Simon Laplace', chinese_name: '拉普拉斯', his_id: 'F_249178', birth_date: '1749-03-23', death_date: '1827-03-05', nationality: '法国', occupation: '数学家、天文学家', biography: '天体力学奠基人，拉普拉斯变换提出者。' },
  { name: 'Carl Friedrich Gauss', chinese_name: '高斯', his_id: 'F_635824', birth_date: '1777-04-30', death_date: '1855-02-23', nationality: '德国', occupation: '数学家', biography: '"数学王子"，在数论、代数、几何等多领域有重大贡献。' },
  { name: 'Michael Faraday', chinese_name: '法拉第', his_id: 'F_370691', birth_date: '1791-09-22', death_date: '1867-08-25', nationality: '英国', occupation: '物理学家', biography: '电磁学奠基人，电磁感应发现者。' },
  { name: 'Joseph Fourier', chinese_name: '傅里叶', his_id: 'F_816254', birth_date: '1768-03-21', death_date: '1830-05-16', nationality: '法国', occupation: '数学家', biography: '傅里叶级数与傅里叶变换提出者。' },
  { name: 'Augustin-Louis Cauchy', chinese_name: '柯西', his_id: 'F_491732', birth_date: '1789-08-21', death_date: '1857-05-23', nationality: '法国', occupation: '数学家', biography: '数学分析奠基人，柯西不等式提出者。' },
  { name: 'Évariste Galois', chinese_name: '伽罗瓦', his_id: 'F_728365', birth_date: '1811-10-25', death_date: '1832-05-31', nationality: '法国', occupation: '数学家', biography: '群论奠基人，21岁死于决斗的天才数学家。' },
  { name: 'Bernhard Riemann', chinese_name: '黎曼', his_id: 'F_543819', birth_date: '1826-09-17', death_date: '1866-07-20', nationality: '德国', occupation: '数学家', biography: '黎曼几何奠基人，黎曼猜想提出者。' },
  { name: 'James Clerk Maxwell', chinese_name: '麦克斯韦', his_id: 'F_690257', birth_date: '1831-06-13', death_date: '1879-11-05', nationality: '英国', occupation: '物理学家', biography: '电磁学集大成者，麦克斯韦方程组提出者。' },
  { name: 'Ludwig Boltzmann', chinese_name: '玻尔兹曼', his_id: 'F_284716', birth_date: '1844-02-20', death_date: '1906-09-05', nationality: '奥地利', occupation: '物理学家', biography: '统计力学奠基人，玻尔兹曼熵公式提出者。' },
  { name: 'Marie Curie', chinese_name: '玛丽·居里', his_id: 'F_475923', birth_date: '1867-11-07', death_date: '1934-07-04', nationality: '法国/波兰', occupation: '物理学家、化学家', biography: '放射性研究先驱，两次获诺贝尔奖。' },
  { name: 'Max Planck', chinese_name: '马克斯·普朗克', his_id: 'F_192648', birth_date: '1858-04-23', death_date: '1947-10-04', nationality: '德国', occupation: '物理学家', biography: '量子物理学创始人，提出能量量子化假说。' },
  { name: 'Erwin Schrödinger', chinese_name: '埃尔温·薛定谔', his_id: 'F_708314', birth_date: '1887-08-12', death_date: '1961-01-04', nationality: '奥地利', occupation: '物理学家', biography: '量子力学奠基人，薛定谔方程提出者。' },
  { name: 'Werner Heisenberg', chinese_name: '维尔纳·海森堡', his_id: 'F_356189', birth_date: '1901-12-05', death_date: '1976-02-01', nationality: '德国', occupation: '物理学家', biography: '量子力学奠基人，不确定性原理提出者。' },
  { name: 'Paul Dirac', chinese_name: '保罗·狄拉克', his_id: 'F_841562', birth_date: '1902-08-08', death_date: '1984-10-20', nationality: '英国', occupation: '物理学家', biography: '量子电动力学先驱，预言反物质存在。' },
  { name: 'Richard Feynman', chinese_name: '理查德·费曼', his_id: 'F_523794', birth_date: '1918-05-11', death_date: '1988-02-15', nationality: '美国', occupation: '物理学家', biography: '量子电动力学奠基人，费曼图发明者。' },
  { name: 'Stephen Hawking', chinese_name: '斯蒂芬·霍金', his_id: 'F_617389', birth_date: '1942-01-08', death_date: '2018-03-14', nationality: '英国', occupation: '物理学家', biography: '理论物理学家，《时间简史》作者。' },
  { name: 'Wilhelm Röntgen', chinese_name: '威廉·伦琴', his_id: 'F_905472', birth_date: '1845-03-27', death_date: '1923-02-10', nationality: '德国', occupation: '物理学家', biography: 'X射线发现者，首届诺贝尔物理学奖得主。' },
  { name: 'Alfred Nobel', chinese_name: '阿尔弗雷德·诺贝尔', his_id: 'F_438261', birth_date: '1833-10-21', death_date: '1896-12-10', nationality: '瑞典', occupation: '化学家、发明家', biography: '炸药发明者，诺贝尔奖创立者。' },
  { name: 'Edwin Hubble', chinese_name: '埃德温·哈勃', his_id: 'F_371694', birth_date: '1889-11-20', death_date: '1953-09-28', nationality: '美国', occupation: '天文学家', biography: '观测宇宙学奠基人，发现宇宙膨胀。' },

  // ══════════ 原 20 位（补回）══════════
  { name: 'Su Shi', chinese_name: '苏轼', his_id: 'beisong_744691', birth_date: '1037-01-08', death_date: '1101-08-24', nationality: '中国', occupation: '文学家、书画家', biography: '北宋文坛领袖，豪放派词人代表。' },
  { name: 'Su Xun', chinese_name: '苏洵', his_id: 'beisong_382105', birth_date: '1009-05-22', death_date: '1066-05-21', nationality: '中国', occupation: '文学家', biography: '北宋散文家，苏轼、苏辙之父。' },
  { name: 'Su Zhe', chinese_name: '苏辙', his_id: 'beisong_569823', birth_date: '1039-03-18', death_date: '1112-10-25', nationality: '中国', occupation: '文学家', biography: '北宋散文家，苏轼之弟。' },
  { name: 'Ouyang Xiu', chinese_name: '欧阳修', his_id: 'beisong_210476', birth_date: '1007-08-01', death_date: '1072-09-22', nationality: '中国', occupation: '文学家、政治家', biography: '北宋文坛领袖，苏轼的座师。' },
  { name: 'Wang Anshi', chinese_name: '王安石', his_id: 'beisong_658394', birth_date: '1021-12-18', death_date: '1086-05-21', nationality: '中国', occupation: '政治家、文学家', biography: '北宋宰相，主持"熙宁变法"，与苏轼政见对立。' },
  { name: 'Li Bai', chinese_name: '李白', his_id: 'tang_147805', birth_date: '701-02-28', death_date: '762-12-??', nationality: '中国', occupation: '诗人', biography: '唐代伟大浪漫主义诗人，被誉为"诗圣"。' },
  { name: 'Du Fu', chinese_name: '杜甫', his_id: 'tang_936271', birth_date: '712-02-12', death_date: '770-??-??', nationality: '中国', occupation: '诗人', biography: '唐代伟大现实主义诗人，被誉为"诗圣"。' },
  { name: 'Socrates', chinese_name: '苏格拉底', his_id: 'F_902347', birth_date: '公元前469年', death_date: '公元前399年', nationality: '古希腊', occupation: '哲学家', biography: '西方哲学奠基人。' },
  { name: 'Plato', chinese_name: '柏拉图', his_id: 'F_561284', birth_date: '公元前427年', death_date: '公元前347年', nationality: '古希腊', occupation: '哲学家', biography: '苏格拉底的学生，亚里士多德的老师。' },
  { name: 'Aristotle', chinese_name: '亚里士多德', his_id: 'F_738015', birth_date: '公元前384年', death_date: '公元前322年', nationality: '古希腊', occupation: '哲学家、科学家', biography: '柏拉图的学生，百科全书式学者。' },
  { name: 'Albert Einstein', chinese_name: '爱因斯坦', his_id: 'F_295671', birth_date: '1879-03-14', death_date: '1955-04-18', nationality: '德国/美国', occupation: '物理学家', biography: '提出相对论，1921年诺贝尔物理学奖。' },
  { name: 'Niels Bohr', chinese_name: '玻尔', his_id: 'F_648023', birth_date: '1885-10-07', death_date: '1962-11-18', nationality: '丹麦', occupation: '物理学家', biography: '量子力学奠基人之一。' },
  { name: 'Sigmund Freud', chinese_name: '弗洛伊德', his_id: 'F_417389', birth_date: '1856-05-06', death_date: '1939-09-23', nationality: '奥地利', occupation: '心理学家', biography: '精神分析学派创始人。' },
  { name: 'Carl Jung', chinese_name: '荣格', his_id: 'F_836501', birth_date: '1875-07-26', death_date: '1961-06-06', nationality: '瑞士', occupation: '心理学家', biography: '分析心理学创始人，弗洛伊德弟子。' },
  { name: 'Beethoven', chinese_name: '贝多芬', his_id: 'F_124780', birth_date: '1770-12-17', death_date: '1827-03-26', nationality: '德国', occupation: '作曲家', biography: '古典音乐巨匠，《命运》《欢乐颂》作者。' },
  { name: 'Haydn', chinese_name: '海顿', his_id: 'F_596342', birth_date: '1732-03-31', death_date: '1809-05-31', nationality: '奥地利', occupation: '作曲家', biography: '交响曲之父，贝多芬的老师。' },
  { name: 'Mozart', chinese_name: '莫扎特', his_id: 'F_870613', birth_date: '1756-01-27', death_date: '1791-12-05', nationality: '奥地利', occupation: '作曲家', biography: '古典音乐大师，与海顿结为忘年之交。' },
];

// ── 已有名人 ID 范围 ──
// 1-3: 孔子师徒   4-6: 宋词三苏   7-10: 唐/宋   11-20: 原20位（保留原ID映射）
// 新数据插入后 ID 会按顺序分配，关系数组中的 ID 与 celebrities 数组索引一一对应（索引+1=ID）

// 为方便书写，关系用 [source索引, target索引, 类型]
const C = (idx) => idx + 1; // 数组索引转 ID

const relationships = [
  // 孔子(1) 颜回(2) 子路(3)
  [C(2), C(1), R.老师], [C(3), C(1), R.老师],
  [C(1), C(2), R.学生], [C(1), C(3), R.学生],
  [C(2), C(3), R.兄弟],

  // ── 春秋人物关系 ──
  // 孔子 ↔ 老子（思想交流）
  [C(1), C(4), R.老师],   // 孔子 → 老师 → 老子（孔子曾问礼于老子）
  [C(4), C(1), R.学生],   // 老子 → 学生 → 孔子
  // 管仲 ↔ 鲍叔牙（千古友谊）
  [C(6), C(7), R.朋友],   // 管仲 — 朋友 — 鲍叔牙
  // 齐桓公 ↔ 管仲（君臣）
  [C(8), C(6), R.老师],   // 齐桓公 → 老师 → 管仲（管仲是齐桓公的谋臣）
  // 勾践 ↔ 夫差（世仇）
  [C(14), C(15), R.政敌], // 勾践 — 政敌 — 夫差
  // 勾践 ↔ 范蠡（君臣）
  [C(14), C(16), R.老师], // 勾践 → 老师 → 范蠡
  // 范蠡 ↔ 西施（情人）
  [C(16), C(17), R.情人], // 范蠡 ↔ 情人 ↔ 西施
  // 西施 ↔ 夫差（情人）
  [C(17), C(15), R.情人], // 西施 ↔ 情人 ↔ 夫差
  // 伍子胥 ↔ 孙武（同事）
  [C(13), C(5), R.同事],  // 伍子胥 — 同事 — 孙武
  // 秦穆公 ↔ 百里奚（君臣）
  [C(11), C(20), R.老师], // 秦穆公 → 老师 → 百里奚
  // 介子推 ↔ 晋文公（君臣）
  [C(18), C(9), R.老师],  // 介子推 → 老师 → 晋文公

  // ── 战国人物关系 ──
  // 孟子 → 老师 → 孔子（继承）
  [C(21), C(1), R.老师],  // 孟子 → 老师 → 孔子
  // 荀子 → 学生 → 韩非子
  [C(23), C(25), R.学生], // 荀子 → 学生 → 韩非子
  // 荀子 → 学生 → 李斯
  [C(23), C(40), R.学生], // 荀子 → 学生 → 李斯
  // 廉颇 ↔ 蔺相如（同事）
  [C(27), C(28), R.同事], // 廉颇 — 同事 — 蔺相如
  // 孙膑 ↔ 庞涓（师兄弟/政敌）
  [C(31), C(32), R.兄弟], // 孙膑 ↔ 兄弟 ↔ 庞涓（同门师兄弟）
  [C(31), C(32), R.政敌], // 孙膑 — 政敌 — 庞涓
  // 苏秦 ↔ 张仪（政敌/纵横对手）
  [C(33), C(34), R.政敌], // 苏秦 — 政敌 — 张仪
  // 白起 ↔ 王翦（同事）
  [C(29), C(30), R.同事], // 白起 — 同事 — 王翦
  // 荆轲 → 老师 → ...（荆轲受燕太子丹之托）
  // 屈原（独自一人，无关系）

  // ── 历朝历代关系 ──
  // 秦始皇 ↔ 李斯（君臣）
  [C(41), C(40), R.同事], // 秦始皇 — 同事 — 李斯
  // 刘邦 ↔ 项羽（政敌）
  [C(43), C(42), R.政敌], // 刘邦 — 政敌 — 项羽
  // 曹操 ↔ 诸葛亮（政敌）
  [C(45), C(46), R.政敌], // 曹操 — 政敌 — 诸葛亮
  // 岳飞 ↔ 秦桧... 不在列表
];

export async function seed() {
  await initSchema();
  const db = getDb();

  db.run('DELETE FROM relationships');
  db.run('DELETE FROM celebrities');
  db.run("DELETE FROM sqlite_sequence WHERE name IN ('celebrities', 'relationships')");

  const insertCeleb = db.prepare(
    `INSERT OR IGNORE INTO celebrities (name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of celebrities) {
    insertCeleb.bind([c.name, c.chinese_name, c.his_id, c.birth_date, c.death_date, c.nationality, c.occupation, c.biography]);
    insertCeleb.step();
    insertCeleb.reset();
  }
  insertCeleb.free();

  const insertRel = db.prepare(`INSERT OR IGNORE INTO relationships (source_id, target_id, type_id) VALUES (?, ?, ?)`);
  for (const [src, tgt, typeId] of relationships) {
    insertRel.bind([src, tgt, typeId]);
    insertRel.step();
    insertRel.reset();
  }
  insertRel.free();

  saveDb();
  console.log(`✅ 已导入 ${celebrities.length} 位名人, ${relationships.length} 条关系`);
}

seed().catch(console.error);
