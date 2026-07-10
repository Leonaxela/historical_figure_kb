import { getDb, initSchema, saveDb } from '../database/init.js';

const celebrities = [
  // ══════════ 中国_春秋 (20 位) ══════════
  { name: 'Confucius', chinese_name: '孔子', his_id: 'chunqiu_804532', birth_date: '公元前551年', death_date: '公元前479年', nationality: '中国_春秋', occupation: '哲学家、教育家', biography: '儒家学派创始人，中国古代最伟大的思想家、教育家。' },
  { name: 'Yan Hui', chinese_name: '颜回', his_id: 'chunqiu_671209', birth_date: '公元前521年', death_date: '公元前481年', nationality: '中国_春秋', occupation: '哲学家', biography: '孔子最得意的弟子，以德行著称，被尊为"复圣"。' },
  { name: 'Zi Lu', chinese_name: '子路', his_id: 'chunqiu_435876', birth_date: '公元前542年', death_date: '公元前480年', nationality: '中国_春秋', occupation: '政治家', biography: '孔子弟子，以勇武直率著称，曾任卫国大夫。' },
  { name: 'Laozi', chinese_name: '老子', his_id: 'chunqiu_190283', birth_date: '约公元前571年', death_date: '约公元前471年', nationality: '中国_春秋', occupation: '哲学家', biography: '道家学派创始人，《道德经》作者。' },
  { name: 'Sun Wu', chinese_name: '孙武', his_id: 'chunqiu_547261', birth_date: '约公元前545年', death_date: '约公元前470年', nationality: '中国_春秋', occupation: '军事家', biography: '《孙子兵法》作者，被誉为"兵圣"。' },
  { name: 'Guan Zhong', chinese_name: '管仲', his_id: 'chunqiu_386729', birth_date: '约公元前723年', death_date: '公元前645年', nationality: '中国_春秋', occupation: '政治家', biography: '春秋时期著名政治家，辅佐齐桓公称霸。' },
  { name: 'Bao Shuya', chinese_name: '鲍叔牙', his_id: 'chunqiu_615843', birth_date: '约公元前723年', death_date: '公元前644年', nationality: '中国_春秋', occupation: '政治家', biography: '春秋时期齐国大夫，管仲挚友，以知人善荐著称。' },
  { name: 'Duke Huan of Qi', chinese_name: '齐桓公', his_id: 'chunqiu_472958', birth_date: '约公元前716年', death_date: '公元前643年', nationality: '中国_春秋', occupation: '君主', biography: '春秋五霸之首，任用管仲进行改革。' },
  { name: 'Duke Wen of Jin', chinese_name: '晋文公', his_id: 'chunqiu_831546', birth_date: '约公元前697年', death_date: '公元前628年', nationality: '中国_春秋', occupation: '君主', biography: '春秋五霸之一，晋国国君。' },
  { name: 'King Zhuang of Chu', chinese_name: '楚庄王', his_id: 'chunqiu_724159', birth_date: '约公元前613年', death_date: '公元前591年', nationality: '中国_春秋', occupation: '君主', biography: '春秋五霸之一，"一鸣惊人"典故主人公。' },
  { name: 'Duke Mu of Qin', chinese_name: '秦穆公', his_id: 'chunqiu_365812', birth_date: '约公元前682年', death_date: '公元前621年', nationality: '中国_春秋', occupation: '君主', biography: '春秋五霸之一，秦国的奠基者。' },
  { name: 'Yan Ying', chinese_name: '晏婴', his_id: 'chunqiu_528314', birth_date: '公元前578年', death_date: '公元前500年', nationality: '中国_春秋', occupation: '政治家', biography: '春秋齐国大夫，以智慧善辩著称，"晏子使楚"典故主人公。' },
  { name: 'Wu Zixu', chinese_name: '伍子胥', his_id: 'chunqiu_639147', birth_date: '公元前559年', death_date: '公元前484年', nationality: '中国_春秋', occupation: '军事家、政治家', biography: '春秋吴国大夫，助吴王阖闾称霸。' },
  { name: 'Gou Jian', chinese_name: '勾践', his_id: 'chunqiu_285934', birth_date: '约公元前520年', death_date: '公元前465年', nationality: '中国_春秋', occupation: '君主', biography: '越王，"卧薪尝胆"典故主人公。' },
  { name: 'Fu Chai', chinese_name: '夫差', his_id: 'chunqiu_701462', birth_date: '约公元前528年', death_date: '公元前473年', nationality: '中国_春秋', occupation: '君主', biography: '吴王，与越王勾践争霸。' },
  { name: 'Fan Li', chinese_name: '范蠡', his_id: 'chunqiu_476183', birth_date: '公元前536年', death_date: '公元前448年', nationality: '中国_春秋', occupation: '政治家、商人', biography: '越国谋臣，助勾践灭吴后经商成为巨富。' },
  { name: 'Xi Shi', chinese_name: '西施', his_id: 'chunqiu_832507', birth_date: '约公元前506年', death_date: '约公元前450年', nationality: '中国_春秋', occupation: '美人', biography: '中国古代四大美女之首，越王勾践献给吴王夫差的美人。' },
  { name: 'Jie Zitui', chinese_name: '介子推', his_id: 'chunqiu_149265', birth_date: '约公元前655年', death_date: '约公元前636年', nationality: '中国_春秋', occupation: '隐士', biography: '春秋时期晋国贤臣，寒食节纪念的人物。' },
  { name: 'Bo Pi', chinese_name: '伯嚭', his_id: 'chunqiu_903478', birth_date: '约公元前520年', death_date: '公元前473年', nationality: '中国_春秋', occupation: '官员', biography: '吴国太宰，被越国收买，导致吴国灭亡。' },
  { name: 'Baili Xi', chinese_name: '百里奚', his_id: 'chunqiu_256741', birth_date: '约公元前725年', death_date: '约公元前621年', nationality: '中国_春秋', occupation: '政治家', biography: '秦国大夫，辅佐秦穆公称霸西戎。' },

  // ══════════ 中国_战国 (20 位) ══════════
  { name: 'Mencius', chinese_name: '孟子', his_id: 'zhanguo_384721', birth_date: '约公元前372年', death_date: '公元前289年', nationality: '中国_战国', occupation: '哲学家', biography: '儒家代表人物，被尊为"亚圣"。' },
  { name: 'Zhuangzi', chinese_name: '庄子', his_id: 'zhanguo_659213', birth_date: '约公元前369年', death_date: '公元前286年', nationality: '中国_战国', occupation: '哲学家', biography: '道家代表人物，《庄子》作者。' },
  { name: 'Xunzi', chinese_name: '荀子', his_id: 'zhanguo_172846', birth_date: '约公元前313年', death_date: '公元前238年', nationality: '中国_战国', occupation: '哲学家', biography: '儒家代表人物，提出"性恶论"，韩非、李斯之师。' },
  { name: 'Mozi', chinese_name: '墨子', his_id: 'zhanguo_821534', birth_date: '约公元前468年', death_date: '公元前376年', nationality: '中国_战国', occupation: '哲学家', biography: '墨家学派创始人，提出"兼爱非攻"。' },
  { name: 'Han Feizi', chinese_name: '韩非子', his_id: 'zhanguo_493856', birth_date: '约公元前280年', death_date: '公元前233年', nationality: '中国_战国', occupation: '哲学家', biography: '法家代表人物，荀子学生，著作《韩非子》。' },
  { name: 'Qu Yuan', chinese_name: '屈原', his_id: 'zhanguo_568214', birth_date: '约公元前340年', death_date: '公元前278年', nationality: '中国_战国', occupation: '诗人', biography: '战国楚国诗人，《楚辞》代表，端午节纪念人物。' },
  { name: 'Lian Po', chinese_name: '廉颇', his_id: 'zhanguo_723419', birth_date: '约公元前327年', death_date: '公元前243年', nationality: '中国_战国', occupation: '将领', biography: '战国赵国名将，"负荆请罪"典故主人公。' },
  { name: 'Lin Xiangru', chinese_name: '蔺相如', his_id: 'zhanguo_457682', birth_date: '约公元前329年', death_date: '公元前259年', nationality: '中国_战国', occupation: '政治家', biography: '战国赵国上卿，"完璧归赵"典故主人公。' },
  { name: 'Bai Qi', chinese_name: '白起', his_id: 'zhanguo_835291', birth_date: '约公元前332年', death_date: '公元前257年', nationality: '中国_战国', occupation: '将领', biography: '战国秦国名将，号称"人屠"，长平之战主帅。' },
  { name: 'Wang Jian', chinese_name: '王翦', his_id: 'zhanguo_674138', birth_date: '约公元前310年', death_date: '公元前220年', nationality: '中国_战国', occupation: '将领', biography: '战国秦国名将，助秦始皇统一六国。' },
  { name: 'Sun Bin', chinese_name: '孙膑', his_id: 'zhanguo_918263', birth_date: '约公元前380年', death_date: '公元前316年', nationality: '中国_战国', occupation: '军事家', biography: '战国齐国军事家，孙武后代，《孙膑兵法》作者。' },
  { name: 'Pang Juan', chinese_name: '庞涓', his_id: 'zhanguo_345789', birth_date: '约公元前385年', death_date: '公元前342年', nationality: '中国_战国', occupation: '将领', biography: '战国魏国名将，与孙膑同门相残。' },
  { name: 'Su Qin', chinese_name: '苏秦', his_id: 'zhanguo_726581', birth_date: '约公元前380年', death_date: '公元前284年', nationality: '中国_战国', occupation: '纵横家', biography: '战国纵横家，合纵抗秦的倡导者。' },
  { name: 'Zhang Yi', chinese_name: '张仪', his_id: 'zhanguo_419367', birth_date: '约公元前378年', death_date: '公元前309年', nationality: '中国_战国', occupation: '纵横家', biography: '战国纵横家，连横破合纵的倡导者。' },
  { name: 'Lord Xinling', chinese_name: '信陵君', his_id: 'zhanguo_582946', birth_date: '约公元前315年', death_date: '公元前243年', nationality: '中国_战国', occupation: '政治家', biography: '战国四公子之一，窃符救赵的策划者。' },
  { name: 'Lord Mengchang', chinese_name: '孟尝君', his_id: 'zhanguo_134297', birth_date: '约公元前350年', death_date: '公元前279年', nationality: '中国_战国', occupation: '政治家', biography: '战国四公子之一，以养士三千闻名。' },
  { name: 'Lord Pingyuan', chinese_name: '平原君', his_id: 'zhanguo_675481', birth_date: '约公元前308年', death_date: '公元前251年', nationality: '中国_战国', occupation: '政治家', biography: '战国四公子之一，赵国公子。' },
  { name: 'Lord Chunshen', chinese_name: '春申君', his_id: 'zhanguo_289413', birth_date: '约公元前314年', death_date: '公元前238年', nationality: '中国_战国', occupation: '政治家', biography: '战国四公子之一，楚国令尹。' },
  { name: 'Jing Ke', chinese_name: '荆轲', his_id: 'zhanguo_756824', birth_date: '约公元前250年', death_date: '公元前227年', nationality: '中国_战国', occupation: '刺客', biography: '战国刺客，"图穷匕见"典故主人公，刺秦未遂。' },
  { name: 'Li Si', chinese_name: '李斯', his_id: 'zhanguo_623571', birth_date: '约公元前284年', death_date: '公元前208年', nationality: '中国_战国', occupation: '政治家', biography: '秦朝丞相，辅佐秦始皇统一六国，荀子学生。' },

  // ══════════ 中国_秦 (2 位) ══════════
  { name: 'Qin Shi Huang', chinese_name: '秦始皇', his_id: 'qin_590321', birth_date: '公元前259年', death_date: '公元前210年', nationality: '中国_秦', occupation: '皇帝', biography: '中国第一个皇帝，统一六国，建立秦朝。' },
  { name: 'Xiang Yu', chinese_name: '项羽', his_id: 'qin_867234', birth_date: '公元前232年', death_date: '公元前202年', nationality: '中国_秦', occupation: '将领', biography: '西楚霸王，秦末起义军领袖，与刘邦争夺天下。' },

  // ══════════ 中国_西汉 (33 位) ══════════
  { name: 'Liu Bang', chinese_name: '刘邦', his_id: 'xihan_412689', birth_date: '公元前256年', death_date: '公元前195年', nationality: '中国_西汉', occupation: '皇帝', biography: '汉朝开国皇帝，汉高祖。' },
  { name: 'Sima Qian', chinese_name: '司马迁', his_id: 'xihan_735102', birth_date: '约公元前145年', death_date: '约公元前86年', nationality: '中国_西汉', occupation: '史学家', biography: '《史记》作者，中国史学之父。' },
  { name: 'Han Wu Di', chinese_name: '汉武帝', his_id: 'xihan_388927', birth_date: '前156年', death_date: '前87年', nationality: '中国_西汉', occupation: '皇帝', biography: '西汉第七位皇帝（前141年—前87年在位），中国历史上杰出的政治家、军事家、战略家、文学家。 汉景帝刘启与王皇后之子。' },
  { name: 'Empress Lu', chinese_name: '吕雉', his_id: 'xihan_890087', birth_date: '约公元前241年', death_date: '公元前180年', nationality: '中国_西汉', occupation: '太后', biography: '西汉开国皇后，汉高祖刘邦之妻，中国历史上第一位临朝称制的女性。' },
  { name: 'Liu Heng', chinese_name: '刘恒', his_id: 'xihan_412491', birth_date: '公元前203年', death_date: '公元前157年', nationality: '中国_西汉', occupation: '皇帝', biography: '西汉第五位皇帝，汉文帝，开创"文景之治"。' },
  { name: 'Liu Qi', chinese_name: '刘启', his_id: 'xihan_152654', birth_date: '公元前188年', death_date: '公元前141年', nationality: '中国_西汉', occupation: '皇帝', biography: '西汉第六位皇帝，汉景帝，平定七国之乱。' },
  { name: 'Liu Fuling', chinese_name: '刘弗陵', his_id: 'xihan_496611', birth_date: '公元前94年', death_date: '公元前74年', nationality: '中国_西汉', occupation: '皇帝', biography: '西汉第八位皇帝，汉昭帝，霍光辅政。' },
  { name: 'Liu Xun', chinese_name: '刘询', his_id: 'xihan_967936', birth_date: '公元前91年', death_date: '公元前48年', nationality: '中国_西汉', occupation: '皇帝', biography: '西汉第十位皇帝，汉宣帝，中兴之主。' },
  { name: 'Han Xin', chinese_name: '韩信', his_id: 'xihan_011742', birth_date: '约公元前231年', death_date: '公元前196年', nationality: '中国_西汉', occupation: '淮阴侯', biography: '西汉开国名将，国士无双，被萧何誉为"国士无双"。' },
  { name: 'Zhang Liang', chinese_name: '张良', his_id: 'xihan_901034', birth_date: '约公元前250年', death_date: '公元前186年', nationality: '中国_西汉', occupation: '留侯', biography: '西汉开国谋臣，运筹帷幄之中，决胜千里之外。' },
  { name: 'Xiao He', chinese_name: '萧何', his_id: 'xihan_708109', birth_date: '约公元前257年', death_date: '公元前193年', nationality: '中国_西汉', occupation: '酂侯', biography: '西汉开国名相，月下追韩信，功绩卓著。' },
  { name: 'Cao Shen', chinese_name: '曹参', his_id: 'xihan_984063', birth_date: '约公元前255年', death_date: '公元前190年', nationality: '中国_西汉', occupation: '平阳侯', biography: '西汉开国名将、相国，萧规曹随。' },
  { name: 'Zhou Bo', chinese_name: '周勃', his_id: 'xihan_376728', birth_date: '约公元前210年', death_date: '公元前169年', nationality: '中国_西汉', occupation: '绛侯', biography: '西汉开国名将，平定诸吕，拥立文帝。' },
  { name: 'Chen Ping', chinese_name: '陈平', his_id: 'xihan_403361', birth_date: '约公元前200年', death_date: '公元前182年', nationality: '中国_西汉', occupation: '曲逆侯', biography: '西汉开国谋臣，六出奇计，官至丞相。' },
  { name: 'Zhou Yafu', chinese_name: '周亚夫', his_id: 'xihan_755921', birth_date: '约公元前199年', death_date: '公元前143年', nationality: '中国_西汉', occupation: '条侯', biography: '西汉名将，细柳营治军，平定七国之乱。' },
  { name: 'Jia Yi', chinese_name: '贾谊', his_id: 'xihan_628503', birth_date: '公元前200年', death_date: '公元前168年', nationality: '中国_西汉', occupation: '政论家', biography: '西汉政论家、文学家，《过秦论》《治安策》作者。' },
  { name: 'Chao Cuo', chinese_name: '晁错', his_id: 'xihan_475114', birth_date: '约公元前200年', death_date: '公元前154年', nationality: '中国_西汉', occupation: '御史大夫', biography: '西汉政治家，主张削藩，引发七国之乱。' },
  { name: 'Dou Ying', chinese_name: '窦婴', his_id: 'xihan_516706', birth_date: '约公元前190年', death_date: '公元前131年', nationality: '中国_西汉', occupation: '魏其侯', biography: '西汉外戚、名将，平定七国之乱有功。' },
  { name: 'Tian Fen', chinese_name: '田蚡', his_id: 'xihan_433988', birth_date: '约公元前180年', death_date: '公元前131年', nationality: '中国_西汉', occupation: '武安侯', biography: '西汉外戚、丞相，汉武帝时期权臣。' },
  { name: 'Han Anguo', chinese_name: '韩安国', his_id: 'xihan_844452', birth_date: '约公元前180年', death_date: '公元前127年', nationality: '中国_西汉', occupation: '御史大夫', biography: '西汉名臣，善于协调，官至御史大夫。' },
  { name: 'Wei Qing', chinese_name: '卫青', his_id: 'xihan_208463', birth_date: '约公元前150年', death_date: '公元前106年', nationality: '中国_西汉', occupation: '长平侯', biography: '西汉名将，七击匈奴，官至大司马大将军。' },
  { name: 'Huo Qubing', chinese_name: '霍去病', his_id: 'xihan_166727', birth_date: '公元前140年', death_date: '公元前117年', nationality: '中国_西汉', occupation: '冠军侯', biography: '西汉名将，"封狼居胥"，勇冠三军。' },
  { name: 'Li Guang', chinese_name: '李广', his_id: 'xihan_438344', birth_date: '约公元前184年', death_date: '公元前119年', nationality: '中国_西汉', occupation: '飞将军', biography: '西汉名将，骁勇善战，匈奴称之"飞将军"。' },
  { name: 'Zhang Qian', chinese_name: '张骞', his_id: 'xihan_076710', birth_date: '约公元前164年', death_date: '公元前114年', nationality: '中国_西汉', occupation: '博望侯', biography: '西汉外交家，出使西域，开辟丝绸之路。' },
  { name: 'Zhu Fuyan', chinese_name: '主父偃', his_id: 'xihan_505745', birth_date: '约公元前180年', death_date: '公元前126年', nationality: '中国_西汉', occupation: '政治家', biography: '西汉政治家，建议汉武帝推行"推恩令"。' },
  { name: 'Dong Zhongshu', chinese_name: '董仲舒', his_id: 'xihan_989070', birth_date: '公元前179年', death_date: '公元前104年', nationality: '中国_西汉', occupation: '思想家', biography: '西汉思想家，"罢黜百家，独尊儒术"倡导者。' },
  { name: 'Sang Hongyang', chinese_name: '桑弘羊', his_id: 'xihan_445942', birth_date: '约公元前152年', death_date: '公元前80年', nationality: '中国_西汉', occupation: '理财家', biography: '西汉理财家，盐铁官营、均输平准政策推行者。' },
  { name: 'Li Ling', chinese_name: '李陵', his_id: 'xihan_019161', birth_date: '约公元前134年', death_date: '公元前74年', nationality: '中国_西汉', occupation: '骑都尉', biography: '西汉将领，李广之孙，兵败投降匈奴。' },
  { name: 'Huo Guang', chinese_name: '霍光', his_id: 'xihan_946277', birth_date: '约公元前130年', death_date: '公元前68年', nationality: '中国_西汉', occupation: '大司马、大将军', biography: '西汉权臣，霍去病异母弟，辅佐昭宣二帝。' },
  { name: 'Zhao Chongguo', chinese_name: '赵充国', his_id: 'xihan_867998', birth_date: '公元前137年', death_date: '公元前52年', nationality: '中国_西汉', occupation: '营平侯', biography: '西汉名将，平定西羌，主张屯田戍边。' },
  { name: 'Su Wu', chinese_name: '苏武', his_id: 'xihan_730289', birth_date: '约公元前140年', death_date: '公元前60年', nationality: '中国_西汉', occupation: '民族英雄', biography: '西汉使节，出使匈奴被扣十九年，持节不屈。' },
  { name: 'Wang Mang', chinese_name: '王莽', his_id: 'xihan_726031', birth_date: '公元前45年', death_date: '公元23年', nationality: '中国_西汉', occupation: '皇帝', biography: '新朝建立者，代汉立新，推行王莽改制。' },
  { name: 'Liu Jing', chinese_name: '刘敬', his_id: 'xihan_828996', birth_date: '约公元前200年', death_date: '约公元前170年', nationality: '中国_西汉', occupation: '建信侯', biography: '西汉谋臣，建议刘邦建都长安、和亲匈奴。' },

  // ══════════ 中国_三国 (72 位) ══════════
  { name: 'Cao Cao', chinese_name: '曹操', his_id: 'sanguo_548396', birth_date: '155年', death_date: '220年', nationality: '中国_三国', occupation: '政治家、军事家', biography: '东汉末年政治家、军事家、文学家，魏武帝。' },
  { name: 'Zhuge Liang', chinese_name: '诸葛亮', his_id: 'sanguo_621784', birth_date: '181年', death_date: '234年', nationality: '中国_三国', occupation: '政治家、军事家', biography: '三国蜀汉丞相，"鞠躬尽瘁"的典范。' },
  { name: 'Liu Bei', chinese_name: '刘备', his_id: 'sanguo_104332', birth_date: '161年', death_date: '223年', nationality: '中国_三国', occupation: '皇帝', biography: '蜀汉开国皇帝，汉昭烈帝，以仁义著称。' },
  { name: 'Guan Yu', chinese_name: '关羽', his_id: 'sanguo_181960', birth_date: '约160年', death_date: '220年', nationality: '中国_三国', occupation: '前将军、壮缪侯', biography: '三国蜀汉名将，以忠义和武勇著称，被尊为"武圣"。' },
  { name: 'Zhang Fei', chinese_name: '张飞', his_id: 'sanguo_013389', birth_date: '约166年', death_date: '221年', nationality: '中国_三国', occupation: '车骑将军、桓侯', biography: '三国蜀汉名将，以勇猛著称，与关羽并称"万人敌"。' },
  { name: 'Zhao Yun', chinese_name: '赵云', his_id: 'sanguo_083863', birth_date: '约168年', death_date: '229年', nationality: '中国_三国', occupation: '翊军将军、顺平侯', biography: '三国蜀汉名将，以忠诚勇武著称，长坂坡一战成名。' },
  { name: 'Ma Chao', chinese_name: '马超', his_id: 'sanguo_794026', birth_date: '176年', death_date: '222年', nationality: '中国_三国', occupation: '骠骑将军、威侯', biography: '三国蜀汉名将，马腾之子，勇冠三军。' },
  { name: 'Huang Zhong', chinese_name: '黄忠', his_id: 'sanguo_542351', birth_date: '约148年', death_date: '220年', nationality: '中国_三国', occupation: '后将军、刚侯', biography: '三国蜀汉名将，以老当益壮著称，定军山斩夏侯渊。' },
  { name: 'Pang Tong', chinese_name: '庞统', his_id: 'sanguo_161559', birth_date: '179年', death_date: '214年', nationality: '中国_三国', occupation: '军师中郎将、靖侯', biography: '三国蜀汉谋士，号"凤雏"，与诸葛亮齐名。' },
  { name: 'Fa Zheng', chinese_name: '法正', his_id: 'sanguo_407816', birth_date: '176年', death_date: '220年', nationality: '中国_三国', occupation: '尚书令、护军将军、翼侯', biography: '三国蜀汉谋士，助刘备夺取益州。' },
  { name: 'Jiang Wei', chinese_name: '姜维', his_id: 'sanguo_184959', birth_date: '202年', death_date: '264年', nationality: '中国_三国', occupation: '大将军、平襄侯', biography: '三国蜀汉名将，诸葛亮继承人，九伐中原。' },
  { name: 'Jiang Wan', chinese_name: '蒋琬', his_id: 'sanguo_310341', birth_date: '约193年', death_date: '246年', nationality: '中国_三国', occupation: '大司马、安阳恭侯', biography: '三国蜀汉政治家，诸葛亮指定的继承人之一。' },
  { name: 'Sun Qian', chinese_name: '孙乾', his_id: 'sanguo_316475', birth_date: '约168年', death_date: '约215年', nationality: '中国_三国', occupation: '秉忠将军', biography: '三国蜀汉官员，刘备幕僚。' },
  { name: 'Jian Yong', chinese_name: '简雍', his_id: 'sanguo_255341', birth_date: '约170年', death_date: '约215年', nationality: '中国_三国', occupation: '昭德将军', biography: '三国蜀汉官员，刘备同乡，善于言辞。' },
  { name: 'Mi Zhu', chinese_name: '糜竺', his_id: 'sanguo_928327', birth_date: '约165年', death_date: '约215年', nationality: '中国_三国', occupation: '安汉将军', biography: '三国蜀汉官员，富商出身，倾家资助刘备。' },
  { name: 'Wei Yan', chinese_name: '魏延', his_id: 'sanguo_648350', birth_date: '约175年', death_date: '234年', nationality: '中国_三国', occupation: '前军师、征西大将军、南郑侯', biography: '三国蜀汉名将，镇守汉中，以勇略著称。' },
  { name: 'Cao Pi', chinese_name: '曹丕', his_id: 'sanguo_284632', birth_date: '187年', death_date: '226年', nationality: '中国_三国', occupation: '皇帝', biography: '曹魏开国皇帝，魏文帝，三国文学家。' },
  { name: 'Cao Zhi', chinese_name: '曹植', his_id: 'sanguo_156815', birth_date: '192年', death_date: '232年', nationality: '中国_三国', occupation: '陈王、文学家', biography: '三国曹魏文学家，才高八斗，七步成诗。' },
  { name: 'Cao Ren', chinese_name: '曹仁', his_id: 'sanguo_891765', birth_date: '168年', death_date: '223年', nationality: '中国_三国', occupation: '大将军、陈侯', biography: '三国曹魏名将，曹操从弟，善于守城。' },
  { name: 'Cao Hong', chinese_name: '曹洪', his_id: 'sanguo_893795', birth_date: '约170年', death_date: '232年', nationality: '中国_三国', occupation: '骠骑将军、都阳侯', biography: '三国曹魏将领，曹操从弟，曾让马救曹操。' },
  { name: 'Cao Zhen', chinese_name: '曹真', his_id: 'sanguo_962718', birth_date: '约185年', death_date: '231年', nationality: '中国_三国', occupation: '大司马、邵陵侯', biography: '三国曹魏名将，曹操养子，魏国后期支柱。' },
  { name: 'Xiahou Dun', chinese_name: '夏侯惇', his_id: 'sanguo_131644', birth_date: '约157年', death_date: '220年', nationality: '中国_三国', occupation: '大将军、高安乡侯', biography: '三国曹魏名将，曹操族兄弟，以刚烈著称。' },
  { name: 'Xiahou Yuan', chinese_name: '夏侯渊', his_id: 'sanguo_130714', birth_date: '约160年', death_date: '219年', nationality: '中国_三国', occupation: '征西将军、博昌亭侯', biography: '三国曹魏名将，夏侯惇族弟，虎步关右。' },
  { name: 'Xun Yu', chinese_name: '荀彧', his_id: 'sanguo_103810', birth_date: '163年', death_date: '212年', nationality: '中国_三国', occupation: '侍中、尚书令、万岁亭侯', biography: '三国曹魏谋士，王佐之才，曹操统一北方的首席谋臣。' },
  { name: 'Xun You', chinese_name: '荀攸', his_id: 'sanguo_799093', birth_date: '157年', death_date: '214年', nationality: '中国_三国', occupation: '尚书令、陵树亭侯', biography: '三国曹魏谋士，荀彧之侄，曹操的"谋主"。' },
  { name: 'Jia Xu', chinese_name: '贾诩', his_id: 'sanguo_793020', birth_date: '147年', death_date: '223年', nationality: '中国_三国', occupation: '太尉、魏寿乡侯', biography: '三国曹魏谋士，算无遗策，被称为"毒士"。' },
  { name: 'Guo Jia', chinese_name: '郭嘉', his_id: 'sanguo_654395', birth_date: '170年', death_date: '207年', nationality: '中国_三国', occupation: '军师祭酒、洧阳亭侯', biography: '三国曹魏谋士，鬼才，曹操最器重的谋臣之一。' },
  { name: 'Zhang Liao', chinese_name: '张辽', his_id: 'sanguo_658260', birth_date: '169年', death_date: '222年', nationality: '中国_三国', occupation: '前将军、晋阳侯', biography: '三国曹魏名将，威震逍遥津，止小儿夜啼。' },
  { name: 'Xu Huang', chinese_name: '徐晃', his_id: 'sanguo_774285', birth_date: '约165年', death_date: '227年', nationality: '中国_三国', occupation: '右将军、阳平侯', biography: '三国曹魏名将，有周亚夫之风，以治军严整著称。' },
  { name: 'Zhang He', chinese_name: '张郃', his_id: 'sanguo_823842', birth_date: '约167年', death_date: '231年', nationality: '中国_三国', occupation: '征西车骑将军、鄚侯', biography: '三国曹魏名将，五子良将之一，以巧变为称。' },
  { name: 'Sima Yi', chinese_name: '司马懿', his_id: 'sanguo_673521', birth_date: '179年', death_date: '251年', nationality: '中国_三国', occupation: '太傅、舞阳侯', biography: '三国曹魏政治家、军事家，西晋奠基人。' },
  { name: 'Yue Jin', chinese_name: '乐进', his_id: 'sanguo_244216', birth_date: '约170年', death_date: '218年', nationality: '中国_三国', occupation: '右将军、广昌亭侯', biography: '三国曹魏名将，五子良将之一，以骁果先登著称。' },
  { name: 'Yu Jin', chinese_name: '于禁', his_id: 'sanguo_100622', birth_date: '约170年', death_date: '221年', nationality: '中国_三国', occupation: '左将军、益寿亭侯', biography: '三国曹魏名将，五子良将之一，以治军严整著称。' },
  { name: 'Sun Jian', chinese_name: '孙坚', his_id: 'sanguo_815403', birth_date: '155年', death_date: '191年', nationality: '中国_三国', occupation: '破虏将军、豫州刺史', biography: '东汉末年名将，东吴奠基人，孙策、孙权之父。' },
  { name: 'Sun Ce', chinese_name: '孙策', his_id: 'sanguo_387181', birth_date: '175年', death_date: '200年', nationality: '中国_三国', occupation: '讨逆将军、吴侯', biography: '东汉末年割据诸侯，东吴奠基人，绰号"小霸王"。' },
  { name: 'Sun Quan', chinese_name: '孙权', his_id: 'sanguo_320366', birth_date: '182年', death_date: '252年', nationality: '中国_三国', occupation: '皇帝', biography: '东吴开国皇帝，吴大帝，三国鼎立的主要人物之一。' },
  { name: 'Zhou Yu', chinese_name: '周瑜', his_id: 'sanguo_997845', birth_date: '175年', death_date: '210年', nationality: '中国_三国', occupation: '偏将军、南郡太守', biography: '三国东吴名将，赤壁之战主帅，多谋善断。' },
  { name: 'Lu Su', chinese_name: '鲁肃', his_id: 'sanguo_444868', birth_date: '172年', death_date: '217年', nationality: '中国_三国', occupation: '横江将军', biography: '三国东吴谋士、将领，促成孙刘联盟共抗曹操。' },
  { name: 'Lu Meng', chinese_name: '吕蒙', his_id: 'sanguo_138820', birth_date: '179年', death_date: '220年', nationality: '中国_三国', occupation: '虎威将军、孱陵侯', biography: '三国东吴名将，"士别三日"典故主人公，白衣渡江取荆州。' },
  { name: 'Lu Xun', chinese_name: '陆逊', his_id: 'sanguo_119903', birth_date: '183年', death_date: '245年', nationality: '中国_三国', occupation: '大都督、丞相、江陵侯', biography: '三国东吴名将、政治家，夷陵之战大破刘备。' },
  { name: 'Huang Gai', chinese_name: '黄盖', his_id: 'sanguo_655990', birth_date: '约155年', death_date: '约220年', nationality: '中国_三国', occupation: '偏将军、武锋中郎将', biography: '三国东吴名将，赤壁之战献火攻计，"周瑜打黄盖"典故主人公。' },
  { name: 'Cheng Pu', chinese_name: '程普', his_id: 'sanguo_320312', birth_date: '约150年', death_date: '约215年', nationality: '中国_三国', occupation: '荡寇将军、江夏太守', biography: '三国东吴名将，孙吴三代元老，军中称"程公"。' },
  { name: 'Gan Ning', chinese_name: '甘宁', his_id: 'sanguo_608671', birth_date: '约165年', death_date: '约215年', nationality: '中国_三国', occupation: '折冲将军', biography: '三国东吴名将，以勇猛果敢著称，"锦帆贼"出身。' },
  { name: 'Taishi Ci', chinese_name: '太史慈', his_id: 'sanguo_469389', birth_date: '166年', death_date: '206年', nationality: '中国_三国', occupation: '建昌都尉', biography: '三国东吴名将，信义无双，与孙策惺惺相惜。' },
  { name: 'Zhang Zhao', chinese_name: '张昭', his_id: 'sanguo_130161', birth_date: '156年', death_date: '236年', nationality: '中国_三国', occupation: '辅吴将军', biography: '三国东吴重臣，孙权称帝后拜辅吴将军，敢言直谏。' },
  { name: 'Zhuge Jin', chinese_name: '诸葛瑾', his_id: 'sanguo_813280', birth_date: '174年', death_date: '241年', nationality: '中国_三国', occupation: '大将军、宛陵侯', biography: '三国东吴重臣，诸葛亮之兄，出使蜀汉不辱使命。' },
  { name: 'Gu Yong', chinese_name: '顾雍', his_id: 'sanguo_698052', birth_date: '168年', death_date: '243年', nationality: '中国_三国', occupation: '丞相、醴陵侯', biography: '三国东吴名相，为相十九年，政绩卓著。' },
  { name: 'Ling Tong', chinese_name: '凌统', his_id: 'sanguo_469611', birth_date: '约189年', death_date: '约237年', nationality: '中国_三国', occupation: '偏将军', biography: '三国东吴名将，年少成名，合肥之战护卫孙权突围。' },
  { name: 'Zhou Tai', chinese_name: '周泰', his_id: 'sanguo_934385', birth_date: '约170年', death_date: '约225年', nationality: '中国_三国', occupation: '奋威将军', biography: '三国东吴名将，孙权贴身护卫，多次救孙权于危难。' },
  { name: 'Xu Sheng', chinese_name: '徐盛', his_id: 'sanguo_814772', birth_date: '约175年', death_date: '约230年', nationality: '中国_三国', occupation: '安东将军', biography: '三国东吴名将，以疑兵之计退曹丕大军。' },
  { name: 'Ding Feng', chinese_name: '丁奉', his_id: 'sanguo_601868', birth_date: '约190年', death_date: '271年', nationality: '中国_三国', occupation: '右大司马', biography: '三国东吴后期名将，雪中奋短兵，大破魏军。' },
  { name: 'Bu Zhi', chinese_name: '步骘', his_id: 'sanguo_944902', birth_date: '约177年', death_date: '247年', nationality: '中国_三国', occupation: '丞相', biography: '三国东吴重臣，出将入相，宽厚得人心。' },
  { name: 'Dong Zhuo', chinese_name: '董卓', his_id: 'sanguo_205524', birth_date: '约134年', death_date: '192年', nationality: '中国_三国', occupation: '太师、郿侯', biography: '东汉末年权臣，废少帝立献帝，专断朝政，引发诸侯讨伐。' },
  { name: 'Lu Bu', chinese_name: '吕布', his_id: 'sanguo_530375', birth_date: '约151年', death_date: '199年', nationality: '中国_三国', occupation: '奋武将军、温侯', biography: '东汉末年名将，武勇冠绝当世，"三姓家奴"，先后依附丁原、董卓、袁绍。' },
  { name: 'Yuan Shao', chinese_name: '袁绍', his_id: 'sanguo_065144', birth_date: '约154年', death_date: '202年', nationality: '中国_三国', occupation: '大将军、邺侯', biography: '东汉末年割据诸侯，统一河北，官渡之战被曹操击败。' },
  { name: 'Yuan Shu', chinese_name: '袁术', his_id: 'sanguo_288855', birth_date: '约155年', death_date: '199年', nationality: '中国_三国', occupation: '皇帝', biography: '东汉末年割据诸侯，袁绍之弟，僭号称帝。' },
  { name: 'Gongsun Zan', chinese_name: '公孙瓒', his_id: 'sanguo_537934', birth_date: '约160年', death_date: '199年', nationality: '中国_三国', occupation: '前将军、易侯', biography: '东汉末年割据诸侯，白马义从统帅，与袁绍争夺河北。' },
  { name: 'Liu Biao', chinese_name: '刘表', his_id: 'sanguo_527162', birth_date: '142年', death_date: '208年', nationality: '中国_三国', occupation: '镇南将军、荆州牧', biography: '东汉末年割据诸侯，镇守荆州，保境安民。' },
  { name: 'Tao Qian', chinese_name: '陶谦', his_id: 'sanguo_371529', birth_date: '132年', death_date: '194年', nationality: '中国_三国', occupation: '徐州牧', biography: '东汉末年割据诸侯，徐州刺史，三让徐州与刘备。' },
  { name: 'Zhang Xiu', chinese_name: '张绣', his_id: 'sanguo_467225', birth_date: '约170年', death_date: '207年', nationality: '中国_三国', occupation: '骠骑将军', biography: '东汉末年割据诸侯，张济之侄，宛城之战击败曹操。' },
  { name: 'Zhang Lu', chinese_name: '张鲁', his_id: 'sanguo_045508', birth_date: '约170年', death_date: '216年', nationality: '中国_三国', occupation: '镇民中郎将', biography: '东汉末年割据汉中，五斗米道首领，后降曹操。' },
  { name: 'Chen Gong', chinese_name: '陈宫', his_id: 'sanguo_743600', birth_date: '约154年', death_date: '198年', nationality: '中国_三国', occupation: '东郡太守', biography: '东汉末年谋士，辅佐吕布，白门楼殉节。' },
  { name: 'Tian Feng', chinese_name: '田丰', his_id: 'sanguo_895836', birth_date: '约160年', death_date: '200年', nationality: '中国_三国', occupation: '冀州别驾', biography: '东汉末年袁绍帐下谋士，多谋善断，因谏被囚。' },
  { name: 'Yan Liang', chinese_name: '颜良', his_id: 'sanguo_643829', birth_date: '约160年', death_date: '200年', nationality: '中国_三国', occupation: '将领', biography: '东汉末年袁绍部将，河北名将，被关羽斩于白马。' },
  { name: 'Wen Chou', chinese_name: '文丑', his_id: 'sanguo_139443', birth_date: '约160年', death_date: '200年', nationality: '中国_三国', occupation: '将领', biography: '东汉末年袁绍部将，河北名将，延津之战阵亡。' },
  { name: 'Gao Shun', chinese_name: '高顺', his_id: 'sanguo_093014', birth_date: '约160年', death_date: '199年', nationality: '中国_三国', occupation: '中郎将', biography: '东汉末年吕布部将，统领"陷阵营"，以治军严整著称。' },
  { name: 'Wang Yun', chinese_name: '王允', his_id: 'sanguo_789960', birth_date: '137年', death_date: '192年', nationality: '中国_三国', occupation: '司徒', biography: '东汉末年大臣，用连环计除董卓，后被李傕郭汜所杀。' },
  { name: 'Li Jue', chinese_name: '李傕', his_id: 'sanguo_517478', birth_date: '约170年', death_date: '198年', nationality: '中国_三国', occupation: '车骑将军', biography: '东汉末年董卓部将，击败王允，控制长安朝政。' },
  { name: 'Guo Si', chinese_name: '郭汜', his_id: 'sanguo_310312', birth_date: '约170年', death_date: '197年', nationality: '中国_三国', occupation: '后将军', biography: '东汉末年董卓部将，与李傕一同祸乱长安。' },
  { name: 'Hua Xiong', chinese_name: '华雄', his_id: 'sanguo_513882', birth_date: '约150年', death_date: '190年', nationality: '中国_三国', occupation: '都督', biography: '东汉末年董卓部将，汜水关抵御诸侯，被孙坚所杀。' },
  { name: 'Ju Shou', chinese_name: '沮授', his_id: 'sanguo_018024', birth_date: '约160年', death_date: '200年', nationality: '中国_三国', occupation: '监军、奋威将军', biography: '东汉末年袁绍帐下谋士，提出"挟天子以令诸侯"策略。' },
  { name: 'Shen Pei', chinese_name: '审配', his_id: 'sanguo_663622', birth_date: '约160年', death_date: '204年', nationality: '中国_三国', occupation: '治中别驾', biography: '东汉末年袁绍帐下谋士，邺城之战宁死不降。' },

  // ══════════ 中国_唐 (33 位) ══════════
  { name: 'Li Shimin', chinese_name: '李世民', his_id: 'tang_783209', birth_date: '598年', death_date: '649年', nationality: '中国_唐', occupation: '皇帝', biography: '唐太宗，开创"贞观之治"。' },
  { name: 'Li Bai', chinese_name: '李白', his_id: 'tang_147805', birth_date: '701-02-28', death_date: '762-12-??', nationality: '中国_唐', occupation: '诗人', biography: '唐代伟大浪漫主义诗人，被誉为"诗仙"。' },
  { name: 'Du Fu', chinese_name: '杜甫', his_id: 'tang_936271', birth_date: '712-02-12', death_date: '770-??-??', nationality: '中国_唐', occupation: '诗人', biography: '唐代伟大现实主义诗人，被誉为"诗圣"。' },
  { name: 'Li Yuan', chinese_name: '李渊', his_id: 'tang_393101', birth_date: '566年', death_date: '635年', nationality: '中国_唐', occupation: '皇帝', biography: '唐朝开国皇帝，唐高祖，统一全国。' },
  { name: 'Li Jing', chinese_name: '李靖', his_id: 'tang_620472', birth_date: '571年', death_date: '649年', nationality: '中国_唐', occupation: '卫国公、兵部尚书', biography: '唐朝名将，南平萧铣、北灭东突厥，著《李卫公问对》。' },
  { name: 'Fang Xuanling', chinese_name: '房玄龄', his_id: 'tang_978668', birth_date: '579年', death_date: '648年', nationality: '中国_唐', occupation: '梁国公、中书令', biography: '唐朝名相，"房谋杜断"之一，贞观之治核心人物。' },
  { name: 'Du Ruhui', chinese_name: '杜如晦', his_id: 'tang_353875', birth_date: '585年', death_date: '630年', nationality: '中国_唐', occupation: '莱国公、尚书右仆射', biography: '唐朝名相，"房谋杜断"之一，善于决断。' },
  { name: 'Wei Zheng', chinese_name: '魏徵', his_id: 'tang_925006', birth_date: '580年', death_date: '643年', nationality: '中国_唐', occupation: '郑国公、太子太师', biography: '唐朝谏臣，以直言敢谏著称，辅佐太宗开创贞观之治。' },
  { name: 'Zhangsun Wuji', chinese_name: '长孙无忌', his_id: 'tang_283217', birth_date: '594年', death_date: '659年', nationality: '中国_唐', occupation: '赵国公、太尉', biography: '唐朝名相，长孙皇后之兄，主编《唐律疏议》。' },
  { name: 'Yuchi Gong', chinese_name: '尉迟恭', his_id: 'tang_859900', birth_date: '585年', death_date: '658年', nationality: '中国_唐', occupation: '鄂国公、右武候大将军', biography: '唐朝名将，玄武门之变功臣，民间门神之一。' },
  { name: 'Qin Qiong', chinese_name: '秦琼', his_id: 'tang_541182', birth_date: '约571年', death_date: '638年', nationality: '中国_唐', occupation: '翼国公、左武卫大将军', biography: '唐朝名将，勇武过人，民间门神之一。' },
  { name: 'Cheng Yaojin', chinese_name: '程咬金', his_id: 'tang_401895', birth_date: '589年', death_date: '665年', nationality: '中国_唐', occupation: '卢国公、左卫大将军', biography: '唐朝名将，凌烟阁功臣，民间形象"程咬金三板斧"。' },
  { name: 'Wu Zetian', chinese_name: '武则天', his_id: 'tang_397889', birth_date: '624年', death_date: '705年', nationality: '中国_唐', occupation: '皇帝', biography: '中国历史上唯一的女皇帝，改唐为周，发展科举制。' },
  { name: 'Li Longji', chinese_name: '李隆基', his_id: 'tang_801413', birth_date: '685年', death_date: '762年', nationality: '中国_唐', occupation: '皇帝', biography: '唐朝第七位皇帝，唐玄宗，开创开元盛世。' },
  { name: 'Di Renjie', chinese_name: '狄仁杰', his_id: 'tang_974098', birth_date: '630年', death_date: '700年', nationality: '中国_唐', occupation: '梁国公、内史令', biography: '唐朝名相，以明察秋毫著称，武则天时期重臣。' },
  { name: 'Yao Chong', chinese_name: '姚崇', his_id: 'tang_300366', birth_date: '650年', death_date: '721年', nationality: '中国_唐', occupation: '梁国公、中书令', biography: '唐朝名相，"开元四大贤相"之一，辅佐玄宗。' },
  { name: 'Song Jing', chinese_name: '宋璟', his_id: 'tang_133270', birth_date: '663年', death_date: '737年', nationality: '中国_唐', occupation: '广平郡公、尚书右丞相', biography: '唐朝名相，"开元四大贤相"之一，以刚正闻名。' },
  { name: 'Zhang Jiuling', chinese_name: '张九龄', his_id: 'tang_830689', birth_date: '678年', death_date: '740年', nationality: '中国_唐', occupation: '始兴伯、中书令', biography: '唐朝名相、诗人，"海上生明月，天涯共此时"作者。' },
  { name: 'Wang Wei', chinese_name: '王维', his_id: 'tang_846553', birth_date: '701年', death_date: '761年', nationality: '中国_唐', occupation: '尚书右丞', biography: '唐朝诗人、画家，"诗中有画，画中有诗"，山水田园派代表。' },
  { name: 'Meng Haoran', chinese_name: '孟浩然', his_id: 'tang_238600', birth_date: '689年', death_date: '740年', nationality: '中国_唐', occupation: '诗人', biography: '唐朝山水田园派诗人，与王维并称"王孟"。' },
  { name: 'Wang Changling', chinese_name: '王昌龄', his_id: 'tang_865314', birth_date: '698年', death_date: '约756年', nationality: '中国_唐', occupation: '江宁丞', biography: '唐朝边塞诗人，七绝圣手，"秦时明月汉时关"作者。' },
  { name: 'Gao Shi', chinese_name: '高适', his_id: 'tang_309369', birth_date: '约704年', death_date: '765年', nationality: '中国_唐', occupation: '渤海县侯、左散骑常侍', biography: '唐朝边塞诗人，与岑参并称"高岑"。' },
  { name: 'Cen Shen', chinese_name: '岑参', his_id: 'tang_453948', birth_date: '约715年', death_date: '770年', nationality: '中国_唐', occupation: '嘉州刺史', biography: '唐朝边塞诗人，"忽如一夜春风来，千树万树梨花开"作者。' },
  { name: 'Guo Ziyi', chinese_name: '郭子仪', his_id: 'tang_616454', birth_date: '697年', death_date: '781年', nationality: '中国_唐', occupation: '汾阳王、太尉', biography: '唐朝名将，平定安史之乱，再造唐室。' },
  { name: 'Yan Zhenqing', chinese_name: '颜真卿', his_id: 'tang_331390', birth_date: '709年', death_date: '785年', nationality: '中国_唐', occupation: '鲁郡公、太子太师', biography: '唐朝书法家、名臣，颜体书法创始人。' },
  { name: 'Wu Daozi', chinese_name: '吴道子', his_id: 'tang_436380', birth_date: '约680年', death_date: '约759年', nationality: '中国_唐', occupation: '画家', biography: '唐朝画家，被尊为"画圣"，吴带当风。' },
  { name: 'An Lushan', chinese_name: '安禄山', his_id: 'tang_642779', birth_date: '703年', death_date: '757年', nationality: '中国_唐', occupation: '范阳节度使', biography: '唐朝叛将，安史之乱发动者，自称大燕皇帝。' },
  { name: 'Bai Juyi', chinese_name: '白居易', his_id: 'tang_253494', birth_date: '772年', death_date: '846年', nationality: '中国_唐', occupation: '刑部尚书', biography: '唐朝诗人，新乐府运动倡导者，《长恨歌》《琵琶行》作者。' },
  { name: 'Han Yu', chinese_name: '韩愈', his_id: 'tang_586287', birth_date: '768年', death_date: '824年', nationality: '中国_唐', occupation: '吏部侍郎', biography: '唐朝文学家、思想家，古文运动领袖，"唐宋八大家"之首。' },
  { name: 'Liu Zongyuan', chinese_name: '柳宗元', his_id: 'tang_829944', birth_date: '773年', death_date: '819年', nationality: '中国_唐', occupation: '柳州刺史', biography: '唐朝文学家、哲学家，唐宋八大家之一，《永州八记》作者。' },
  { name: 'Li Shangyin', chinese_name: '李商隐', his_id: 'tang_989159', birth_date: '约813年', death_date: '858年', nationality: '中国_唐', occupation: '东川节度使判官', biography: '唐朝诗人，晚唐大家，"相见时难别亦难"作者。' },
  { name: 'Du Mu', chinese_name: '杜牧', his_id: 'tang_055441', birth_date: '803年', death_date: '约852年', nationality: '中国_唐', occupation: '中书舍人', biography: '唐朝诗人、文学家，晚唐大家，"清明时节雨纷纷"作者。' },
  { name: 'Huang Chao', chinese_name: '黄巢', his_id: 'tang_518935', birth_date: '约835年', death_date: '884年', nationality: '中国_唐', occupation: '起义领袖', biography: '唐末农民起义领袖，推翻唐朝统治。' },

  // ══════════ 中国_南宋 (1 位) ══════════
  { name: 'Yue Fei', chinese_name: '岳飞', his_id: 'nansong_516847', birth_date: '1103年', death_date: '1142年', nationality: '中国_南宋', occupation: '将领', biography: '南宋抗金名将，被秦桧以"莫须有"罪名陷害。' },

  // ══════════ 中国_明 (32 位) ══════════
  { name: 'Zheng He', chinese_name: '郑和', his_id: 'ming_294685', birth_date: '1371年', death_date: '1433年', nationality: '中国_明', occupation: '航海家', biography: '明代航海家，七下西洋。' },
  { name: 'Gu Yan Wu', chinese_name: '顾炎武', his_id: 'ming_651890', birth_date: '1613年', death_date: '1682年', nationality: '中国_明', occupation: '思想家、学者', biography: '明末清初思想家、学者，南直隶昆山人。初名继绅、绛，字忠清，后改名炎武，字宁人，因避人陷害，曾化名蒋山佣。居亭林镇，学者尊称亭林先生。 与黄宗羲、王夫之合称清初三先生，加上唐甄合称明末清初“四大启蒙思想家”。' },
  { name: 'Zhu Yuanzhang', chinese_name: '朱元璋', his_id: 'ming_455739', birth_date: '1328-10-21', death_date: '1398-06-24', nationality: '中国_明', occupation: '皇帝', biography: '明朝开国皇帝，明太祖，推翻元朝统治。' },
  { name: 'Zhu Yunwen', chinese_name: '朱允炆', his_id: 'ming_519769', birth_date: '1377年', death_date: '1402年', nationality: '中国_明', occupation: '皇帝', biography: '明朝第二位皇帝，建文帝，被朱棣夺位。' },
  { name: 'Zhu Di', chinese_name: '朱棣', his_id: 'ming_026153', birth_date: '1360-05-02', death_date: '1424-08-12', nationality: '中国_明', occupation: '皇帝', biography: '明朝第三位皇帝，明成祖，迁都北京。' },
  { name: 'Xu Da', chinese_name: '徐达', his_id: 'ming_123636', birth_date: '1332年', death_date: '1385年', nationality: '中国_明', occupation: '魏国公、中山王', biography: '明朝开国第一名将，北伐灭元。' },
  { name: 'Chang Yuchun', chinese_name: '常遇春', his_id: 'ming_405360', birth_date: '1330年', death_date: '1369年', nationality: '中国_明', occupation: '鄂国公、开平王', biography: '明朝开国名将，号称"常十万"。' },
  { name: 'Liu Ji', chinese_name: '刘基', his_id: 'ming_181664', birth_date: '1311年', death_date: '1375年', nationality: '中国_明', occupation: '御史中丞、诚意伯', biography: '明朝开国谋臣，字伯温，辅佐朱元璋平定天下。' },
  { name: 'Li Shanchang', chinese_name: '李善长', his_id: 'ming_485579', birth_date: '1314年', death_date: '1390年', nationality: '中国_明', occupation: '左丞相、韩国公', biography: '明朝开国功臣，太祖时期丞相。' },
  { name: 'Lan Yu', chinese_name: '蓝玉', his_id: 'ming_912871', birth_date: '约1340年', death_date: '1393年', nationality: '中国_明', occupation: '大将军、凉国公', biography: '明朝开国名将，捕鱼儿海大破北元。' },
  { name: 'Zhu Houcong', chinese_name: '朱厚熜', his_id: 'ming_457624', birth_date: '1507-09-16', death_date: '1567-01-23', nationality: '中国_明', occupation: '皇帝', biography: '明朝第十一位皇帝，嘉靖帝，多年不上朝。' },
  { name: 'Zhang Juzheng', chinese_name: '张居正', his_id: 'ming_144901', birth_date: '1525年', death_date: '1582年', nationality: '中国_明', occupation: '内阁首辅、太师', biography: '明朝改革家，实行万历新政，一条鞭法。' },
  { name: 'Hai Rui', chinese_name: '海瑞', his_id: 'ming_264375', birth_date: '1514年', death_date: '1587年', nationality: '中国_明', occupation: '南京右都御史', biography: '明朝清官，以刚正不阿著称，人称"海青天"。' },
  { name: 'Qi Jiguang', chinese_name: '戚继光', his_id: 'ming_528856', birth_date: '1528年', death_date: '1588年', nationality: '中国_明', occupation: '左都督、蓟州总兵', biography: '明朝抗倭名将，组建戚家军，著《纪效新书》。' },
  { name: 'Wang Shouren', chinese_name: '王守仁', his_id: 'ming_940576', birth_date: '1472年', death_date: '1529年', nationality: '中国_明', occupation: '南京兵部尚书、新建伯', biography: '明朝哲学家，心学集大成者，平定宁王之乱。' },
  { name: 'Yu Qian', chinese_name: '于谦', his_id: 'ming_783530', birth_date: '1398年', death_date: '1457年', nationality: '中国_明', occupation: '少保、兵部尚书', biography: '明朝忠臣，北京保卫战击退瓦剌。' },
  { name: 'Yan Song', chinese_name: '严嵩', his_id: 'ming_078826', birth_date: '1480年', death_date: '1567年', nationality: '中国_明', occupation: '内阁首辅、少师', biography: '明朝权臣，执政二十余年，以贪腐著称。' },
  { name: 'Xu Jie', chinese_name: '徐阶', his_id: 'ming_415439', birth_date: '1503年', death_date: '1583年', nationality: '中国_明', occupation: '内阁首辅、少师', biography: '明朝名臣，扳倒严嵩，善用谋略。' },
  { name: 'Zhu Yijun', chinese_name: '朱翊钧', his_id: 'ming_052504', birth_date: '1563-09-04', death_date: '1620-08-18', nationality: '中国_明', occupation: '皇帝', biography: '明朝第十三位皇帝，万历帝，创"万历三大征"。' },
  { name: 'Zhu Youjian', chinese_name: '朱由检', his_id: 'ming_552937', birth_date: '1611-02-06', death_date: '1644-04-25', nationality: '中国_明', occupation: '皇帝', biography: '明朝末代皇帝，崇祯帝，煤山自缢。' },
  { name: 'Wei Zhongxian', chinese_name: '魏忠贤', his_id: 'ming_189746', birth_date: '1568年', death_date: '1627年', nationality: '中国_明', occupation: '司礼监秉笔太监', biography: '明朝宦官，天启年间权倾朝野，号称"九千岁"。' },
  { name: 'Yuan Chonghuan', chinese_name: '袁崇焕', his_id: 'ming_179035', birth_date: '1584年', death_date: '1630年', nationality: '中国_明', occupation: '兵部尚书、蓟辽督师', biography: '明朝抗清名将，宁远大捷大破后金。' },
  { name: 'Sun Chengzong', chinese_name: '孙承宗', his_id: 'ming_658677', birth_date: '1563年', death_date: '1638年', nationality: '中国_明', occupation: '兵部尚书、辽东经略', biography: '明朝军事家，修筑关宁锦防线。' },
  { name: 'Li Zicheng', chinese_name: '李自成', his_id: 'ming_945212', birth_date: '1606年', death_date: '1645年', nationality: '中国_明', occupation: '闯王', biography: '明末农民起义领袖，攻入北京推翻明朝。' },
  { name: 'Zhang Xianzhong', chinese_name: '张献忠', his_id: 'ming_991716', birth_date: '1606年', death_date: '1647年', nationality: '中国_明', occupation: '大西王', biography: '明末农民起义领袖，建立大西政权。' },
  { name: 'Shi Kefa', chinese_name: '史可法', his_id: 'ming_986703', birth_date: '1601年', death_date: '1645年', nationality: '中国_明', occupation: '兵部尚书', biography: '南明忠臣，扬州十日殉国。' },
  { name: 'Li Shizhen', chinese_name: '李时珍', his_id: 'ming_481222', birth_date: '1518年', death_date: '1593年', nationality: '中国_明', occupation: '太医院判', biography: '明朝医药学家，著《本草纲目》。' },
  { name: 'Xu Guangqi', chinese_name: '徐光启', his_id: 'ming_150064', birth_date: '1562年', death_date: '1633年', nationality: '中国_明', occupation: '礼部尚书、文渊阁大学士', biography: '明朝科学家，翻译《几何原本》，著《农政全书》。' },
  { name: 'Song Yingxing', chinese_name: '宋应星', his_id: 'ming_398610', birth_date: '1587年', death_date: '约1666年', nationality: '中国_明', occupation: '亳州知州', biography: '明朝科学家，著《天工开物》。' },
  { name: 'Xie Jin', chinese_name: '解缙', his_id: 'ming_781275', birth_date: '1369年', death_date: '1415年', nationality: '中国_明', occupation: '翰林学士、内阁首辅', biography: '明朝文学家，主编《永乐大典》。' },
  { name: 'Wu Cheng'en', chinese_name: '吴承恩', his_id: 'ming_340759', birth_date: '约1500年', death_date: '1582年', nationality: '中国_明', occupation: '长兴县丞', biography: '明朝小说家，著《西游记》。' },
  { name: 'Tang Yin', chinese_name: '唐寅', his_id: 'ming_417390', birth_date: '1470年', death_date: '1524年', nationality: '中国_明', occupation: '解元、画家', biography: '明朝画家、文人，"江南四大才子"之首。' },

  // ══════════ 中国_清 (1 位) ══════════
  { name: 'Kangxi', chinese_name: '康熙帝', his_id: 'qing_371568', birth_date: '1654年', death_date: '1722年', nationality: '中国_清', occupation: '皇帝', biography: '清朝第四位皇帝，开创"康乾盛世"。' },

  // ══════════ 古希腊 (4 位) ══════════
  { name: 'Archimedes', chinese_name: '阿基米德', his_id: 'F_510237', birth_date: '约公元前287年', death_date: '公元前212年', nationality: '古希腊', occupation: '数学家、物理学家', biography: '古希腊伟大的数学家、物理学家，阿基米德原理发现者。' },
  { name: 'Socrates', chinese_name: '苏格拉底', his_id: 'F_902347', birth_date: '公元前469年', death_date: '公元前399年', nationality: '古希腊', occupation: '哲学家', biography: '西方哲学奠基人。' },
  { name: 'Plato', chinese_name: '柏拉图', his_id: 'F_561284', birth_date: '公元前427年', death_date: '公元前347年', nationality: '古希腊', occupation: '哲学家', biography: '苏格拉底的学生，亚里士多德的老师。' },
  { name: 'Aristotle', chinese_name: '亚里士多德', his_id: 'F_738015', birth_date: '公元前384年', death_date: '公元前322年', nationality: '古希腊', occupation: '哲学家、科学家', biography: '柏拉图的学生，百科全书式学者。' },

  // ══════════ 波兰 (1 位) ══════════
  { name: 'Nicolaus Copernicus', chinese_name: '哥白尼', his_id: 'F_689345', birth_date: '1473-02-19', death_date: '1543-05-24', nationality: '波兰', occupation: '天文学家', biography: '日心说创始人，近代天文学奠基人。' },

  // ══════════ 意大利 (1 位) ══════════
  { name: 'Galileo Galilei', chinese_name: '伽利略', his_id: 'F_472831', birth_date: '1564-02-15', death_date: '1642-01-08', nationality: '意大利', occupation: '天文学家、物理学家', biography: '近代科学之父，天文观测和力学研究的先驱。' },

  // ══════════ 德国 (8 位) ══════════
  { name: 'Johannes Kepler', chinese_name: '开普勒', his_id: 'F_826593', birth_date: '1571-12-27', death_date: '1630-11-15', nationality: '德国', occupation: '天文学家', biography: '发现行星运动三大定律，为牛顿万有引力奠基。' },
  { name: 'Gottfried Leibniz', chinese_name: '莱布尼茨', his_id: 'F_802647', birth_date: '1646-07-01', death_date: '1716-11-14', nationality: '德国', occupation: '数学家、哲学家', biography: '微积分创始人之一，二进制发明者。' },
  { name: 'Carl Friedrich Gauss', chinese_name: '高斯', his_id: 'F_635824', birth_date: '1777-04-30', death_date: '1855-02-23', nationality: '德国', occupation: '数学家', biography: '"数学王子"，在数论、代数、几何等多领域有重大贡献。' },
  { name: 'Bernhard Riemann', chinese_name: '黎曼', his_id: 'F_543819', birth_date: '1826-09-17', death_date: '1866-07-20', nationality: '德国', occupation: '数学家', biography: '黎曼几何奠基人，黎曼猜想提出者。' },
  { name: 'Max Planck', chinese_name: '马克斯·普朗克', his_id: 'F_192648', birth_date: '1858-04-23', death_date: '1947-10-04', nationality: '德国', occupation: '物理学家', biography: '量子物理学创始人，提出能量量子化假说。' },
  { name: 'Werner Heisenberg', chinese_name: '维尔纳·海森堡', his_id: 'F_356189', birth_date: '1901-12-05', death_date: '1976-02-01', nationality: '德国', occupation: '物理学家', biography: '量子力学奠基人，不确定性原理提出者。' },
  { name: 'Wilhelm Röntgen', chinese_name: '威廉·伦琴', his_id: 'F_905472', birth_date: '1845-03-27', death_date: '1923-02-10', nationality: '德国', occupation: '物理学家', biography: 'X射线发现者，首届诺贝尔物理学奖得主。' },
  { name: 'Beethoven', chinese_name: '贝多芬', his_id: 'F_124780', birth_date: '1770-12-17', death_date: '1827-03-26', nationality: '德国', occupation: '作曲家', biography: '古典音乐巨匠，《命运》《欢乐颂》作者。' },

  // ══════════ 法国 (7 位) ══════════
  { name: 'René Descartes', chinese_name: '笛卡尔', his_id: 'F_391478', birth_date: '1596-03-31', death_date: '1650-02-11', nationality: '法国', occupation: '数学家、哲学家', biography: '解析几何创始人，"我思故我在"。' },
  { name: 'Pierre de Fermat', chinese_name: '费马', his_id: 'F_547832', birth_date: '1607-10-31', death_date: '1665-01-12', nationality: '法国', occupation: '数学家', biography: '数论奠基人，费马大定理提出者。' },
  { name: 'Blaise Pascal', chinese_name: '帕斯卡', his_id: 'F_283691', birth_date: '1623-06-19', death_date: '1662-08-19', nationality: '法国', occupation: '数学家、物理学家', biography: '概率论奠基人，帕斯卡定律发现者。' },
  { name: 'Pierre-Simon Laplace', chinese_name: '拉普拉斯', his_id: 'F_249178', birth_date: '1749-03-23', death_date: '1827-03-05', nationality: '法国', occupation: '数学家、天文学家', biography: '天体力学奠基人，拉普拉斯变换提出者。' },
  { name: 'Joseph Fourier', chinese_name: '傅里叶', his_id: 'F_816254', birth_date: '1768-03-21', death_date: '1830-05-16', nationality: '法国', occupation: '数学家', biography: '傅里叶级数与傅里叶变换提出者。' },
  { name: 'Augustin-Louis Cauchy', chinese_name: '柯西', his_id: 'F_491732', birth_date: '1789-08-21', death_date: '1857-05-23', nationality: '法国', occupation: '数学家', biography: '数学分析奠基人，柯西不等式提出者。' },
  { name: 'Évariste Galois', chinese_name: '伽罗瓦', his_id: 'F_728365', birth_date: '1811-10-25', death_date: '1832-05-31', nationality: '法国', occupation: '数学家', biography: '群论奠基人，21岁死于决斗的天才数学家。' },

  // ══════════ 英国 (5 位) ══════════
  { name: 'Isaac Newton', chinese_name: '艾萨克·牛顿', his_id: 'F_714562', birth_date: '1643-01-04', death_date: '1727-03-31', nationality: '英国', occupation: '物理学家、数学家', biography: '万有引力定律和三大运动定律提出者，经典物理学奠基人。' },
  { name: 'Michael Faraday', chinese_name: '法拉第', his_id: 'F_370691', birth_date: '1791-09-22', death_date: '1867-08-25', nationality: '英国', occupation: '物理学家', biography: '电磁学奠基人，电磁感应发现者。' },
  { name: 'James Clerk Maxwell', chinese_name: '麦克斯韦', his_id: 'F_690257', birth_date: '1831-06-13', death_date: '1879-11-05', nationality: '英国', occupation: '物理学家', biography: '电磁学集大成者，麦克斯韦方程组提出者。' },
  { name: 'Paul Dirac', chinese_name: '保罗·狄拉克', his_id: 'F_841562', birth_date: '1902-08-08', death_date: '1984-10-20', nationality: '英国', occupation: '物理学家', biography: '量子电动力学先驱，预言反物质存在。' },
  { name: 'Stephen Hawking', chinese_name: '斯蒂芬·霍金', his_id: 'F_617389', birth_date: '1942-01-08', death_date: '2018-03-14', nationality: '英国', occupation: '物理学家', biography: '理论物理学家，《时间简史》作者。' },

  // ══════════ 瑞士 (2 位) ══════════
  { name: 'Leonhard Euler', chinese_name: '欧拉', his_id: 'F_463829', birth_date: '1707-04-15', death_date: '1783-09-18', nationality: '瑞士', occupation: '数学家', biography: '史上最多产的数学家，欧拉公式提出者。' },
  { name: 'Carl Jung', chinese_name: '荣格', his_id: 'F_836501', birth_date: '1875-07-26', death_date: '1961-06-06', nationality: '瑞士', occupation: '心理学家', biography: '分析心理学创始人，弗洛伊德弟子。' },

  // ══════════ 意大利/法国 (1 位) ══════════
  { name: 'Joseph-Louis Lagrange', chinese_name: '拉格朗日', his_id: 'F_587316', birth_date: '1736-01-25', death_date: '1813-04-10', nationality: '意大利/法国', occupation: '数学家', biography: '变分法奠基人，拉格朗日力学创立者。' },

  // ══════════ 奥地利 (5 位) ══════════
  { name: 'Ludwig Boltzmann', chinese_name: '玻尔兹曼', his_id: 'F_284716', birth_date: '1844-02-20', death_date: '1906-09-05', nationality: '奥地利', occupation: '物理学家', biography: '统计力学奠基人，玻尔兹曼熵公式提出者。' },
  { name: 'Erwin Schrödinger', chinese_name: '埃尔温·薛定谔', his_id: 'F_708314', birth_date: '1887-08-12', death_date: '1961-01-04', nationality: '奥地利', occupation: '物理学家', biography: '量子力学奠基人，薛定谔方程提出者。' },
  { name: 'Sigmund Freud', chinese_name: '弗洛伊德', his_id: 'F_417389', birth_date: '1856-05-06', death_date: '1939-09-23', nationality: '奥地利', occupation: '心理学家', biography: '精神分析学派创始人。' },
  { name: 'Haydn', chinese_name: '海顿', his_id: 'F_596342', birth_date: '1732-03-31', death_date: '1809-05-31', nationality: '奥地利', occupation: '作曲家', biography: '交响曲之父，贝多芬的老师。' },
  { name: 'Mozart', chinese_name: '莫扎特', his_id: 'F_870613', birth_date: '1756-01-27', death_date: '1791-12-05', nationality: '奥地利', occupation: '作曲家', biography: '古典音乐大师，与海顿结为忘年之交。' },

  // ══════════ 法国/波兰 (1 位) ══════════
  { name: 'Marie Curie', chinese_name: '玛丽·居里', his_id: 'F_475923', birth_date: '1867-11-07', death_date: '1934-07-04', nationality: '法国/波兰', occupation: '物理学家、化学家', biography: '放射性研究先驱，两次获诺贝尔奖。' },

  // ══════════ 美国 (2 位) ══════════
  { name: 'Richard Feynman', chinese_name: '理查德·费曼', his_id: 'F_523794', birth_date: '1918-05-11', death_date: '1988-02-15', nationality: '美国', occupation: '物理学家', biography: '量子电动力学奠基人，费曼图发明者。' },
  { name: 'Edwin Hubble', chinese_name: '埃德温·哈勃', his_id: 'F_371694', birth_date: '1889-11-20', death_date: '1953-09-28', nationality: '美国', occupation: '天文学家', biography: '观测宇宙学奠基人，发现宇宙膨胀。' },

  // ══════════ 瑞典 (1 位) ══════════
  { name: 'Alfred Nobel', chinese_name: '阿尔弗雷德·诺贝尔', his_id: 'F_438261', birth_date: '1833-10-21', death_date: '1896-12-10', nationality: '瑞典', occupation: '化学家、发明家', biography: '炸药发明者，诺贝尔奖创立者。' },

  // ══════════ 中国_北宋 (6 位) ══════════
  { name: 'Su Shi', chinese_name: '苏轼', his_id: 'beisong_744691', birth_date: '1037-01-08', death_date: '1101-08-24', nationality: '中国_北宋', occupation: '文学家、书画家', biography: '北宋文坛领袖，豪放派词人代表。' },
  { name: 'Su Xun', chinese_name: '苏洵', his_id: 'beisong_382105', birth_date: '1009-05-22', death_date: '1066-05-21', nationality: '中国_北宋', occupation: '文学家', biography: '北宋散文家，苏轼、苏辙之父。' },
  { name: 'Su Zhe', chinese_name: '苏辙', his_id: 'beisong_569823', birth_date: '1039-03-18', death_date: '1112-10-25', nationality: '中国_北宋', occupation: '文学家', biography: '北宋散文家，苏轼之弟。' },
  { name: 'Ouyang Xiu', chinese_name: '欧阳修', his_id: 'beisong_210476', birth_date: '1007-08-01', death_date: '1072-09-22', nationality: '中国_北宋', occupation: '文学家、政治家', biography: '北宋文坛领袖，苏轼的座师。' },
  { name: 'Wang Anshi', chinese_name: '王安石', his_id: 'beisong_658394', birth_date: '1021-12-18', death_date: '1086-05-21', nationality: '中国_北宋', occupation: '政治家、文学家', biography: '北宋宰相，主持"熙宁变法"，与苏轼政见对立。' },
  { name: 'Zhao Kuang Yin', chinese_name: '赵匡胤', his_id: 'beisong_472115', birth_date: '927年3月21日', death_date: '976年11月14日', nationality: '中国_北宋', occupation: '皇帝', biography: '五代至北宋初年军事家、政治家、战略家，宋朝开国皇帝（960年2月4日－976年11月14日在位）。后周护圣都指挥使赵弘殷（宋宣祖）次子，母为杜氏（昭宪太后）' },

  // ══════════ 德国/美国 (1 位) ══════════
  { name: 'Albert Einstein', chinese_name: '爱因斯坦', his_id: 'F_295671', birth_date: '1879-03-14', death_date: '1955-04-18', nationality: '德国/美国', occupation: '物理学家', biography: '提出相对论，1921年诺贝尔物理学奖。' },

  // ══════════ 丹麦 (1 位) ══════════
  { name: 'Niels Bohr', chinese_name: '玻尔', his_id: 'F_648023', birth_date: '1885-10-07', death_date: '1962-11-18', nationality: '丹麦', occupation: '物理学家', biography: '量子力学奠基人之一。' },

  // ══════════ 中国_东汉 (30 位) ══════════
  { name: 'Liu Xiu', chinese_name: '刘秀', his_id: 'donghan_552199', birth_date: '公元前5年', death_date: '公元57年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉开国皇帝，汉光武帝，以柔道治国。' },
  { name: 'Liu Zhuang', chinese_name: '刘庄', his_id: 'donghan_620997', birth_date: '28年', death_date: '75年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉第二位皇帝，汉明帝，派人求佛法。' },
  { name: 'Liu Da', chinese_name: '刘炟', his_id: 'donghan_157180', birth_date: '57年', death_date: '88年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉第三位皇帝，汉章帝，明章之治。' },
  { name: 'Liu Zhao', chinese_name: '刘肇', his_id: 'donghan_629055', birth_date: '79年', death_date: '106年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉第四位皇帝，汉和帝，诛窦宪亲政。' },
  { name: 'Liu Zhi', chinese_name: '刘志', his_id: 'donghan_613336', birth_date: '132年', death_date: '168年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉第十一位皇帝，汉桓帝，宦官专权。' },
  { name: 'Liu Hong', chinese_name: '刘宏', his_id: 'donghan_277253', birth_date: '156年', death_date: '189年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉第十二位皇帝，汉灵帝，黄巾起义爆发。' },
  { name: 'Liu Xie', chinese_name: '刘协', his_id: 'donghan_848081', birth_date: '181年', death_date: '234年', nationality: '中国_东汉', occupation: '皇帝', biography: '东汉末代皇帝，汉献帝，被曹操挟持。' },
  { name: 'Deng Yu', chinese_name: '邓禹', his_id: 'donghan_901660', birth_date: '2年', death_date: '58年', nationality: '中国_东汉', occupation: '高密侯', biography: '东汉开国名将，云台二十八将之首，辅佐刘秀。' },
  { name: 'Wu Han', chinese_name: '吴汉', his_id: 'donghan_353662', birth_date: '约5年', death_date: '44年', nationality: '中国_东汉', occupation: '广平侯', biography: '东汉开国名将，云台二十八将之一，勇猛善战。' },
  { name: 'Jia Fu', chinese_name: '贾复', his_id: 'donghan_690676', birth_date: '9年', death_date: '55年', nationality: '中国_东汉', occupation: '胶东侯', biography: '东汉开国名将，云台二十八将之一，以勇武著称。' },
  { name: 'Geng Yan', chinese_name: '耿弇', his_id: 'donghan_696794', birth_date: '3年', death_date: '58年', nationality: '中国_东汉', occupation: '好畤侯', biography: '东汉开国名将，云台二十八将之一，平定齐鲁。' },
  { name: 'Kou Xun', chinese_name: '寇恂', his_id: 'donghan_699667', birth_date: '约5年', death_date: '36年', nationality: '中国_东汉', occupation: '雍奴侯', biography: '东汉开国名将，云台二十八将之一，善于治理。' },
  { name: 'Cen Peng', chinese_name: '岑彭', his_id: 'donghan_940561', birth_date: '约5年', death_date: '35年', nationality: '中国_东汉', occupation: '舞阴侯', biography: '东汉开国名将，云台二十八将之一，伐蜀有功。' },
  { name: 'Feng Yi', chinese_name: '冯异', his_id: 'donghan_500554', birth_date: '约5年', death_date: '34年', nationality: '中国_东汉', occupation: '阳夏侯', biography: '东汉开国名将，云台二十八将之一，"大树将军"。' },
  { name: 'Ma Yuan', chinese_name: '马援', his_id: 'donghan_940880', birth_date: '14年', death_date: '49年', nationality: '中国_东汉', occupation: '伏波将军', biography: '东汉名将，"马革裹尸"典故主人公，平定交趾。' },
  { name: 'Ban Chao', chinese_name: '班超', his_id: 'donghan_557105', birth_date: '32年', death_date: '102年', nationality: '中国_东汉', occupation: '定远侯', biography: '东汉外交家、名将，投笔从戎，经营西域三十一年。' },
  { name: 'Dou Gu', chinese_name: '窦固', his_id: 'donghan_622804', birth_date: '约30年', death_date: '88年', nationality: '中国_东汉', occupation: '显亲侯', biography: '东汉名将，出击匈奴，班超的举荐者。' },
  { name: 'Dou Xian', chinese_name: '窦宪', his_id: 'donghan_331002', birth_date: '约50年', death_date: '92年', nationality: '中国_东汉', occupation: '冠军侯', biography: '东汉名将、外戚，燕然勒功，大破北匈奴。' },
  { name: 'Ban Gu', chinese_name: '班固', his_id: 'donghan_812676', birth_date: '32年', death_date: '92年', nationality: '中国_东汉', occupation: '史学家', biography: '东汉史学家、文学家，《汉书》作者。' },
  { name: 'Ban Zhao', chinese_name: '班昭', his_id: 'donghan_742247', birth_date: '约45年', death_date: '约117年', nationality: '中国_东汉', occupation: '史学家', biography: '东汉史学家，班固之妹，续写《汉书》，著《女诫》。' },
  { name: 'Wang Chong', chinese_name: '王充', his_id: 'donghan_049102', birth_date: '27年', death_date: '约97年', nationality: '中国_东汉', occupation: '思想家', biography: '东汉思想家，《论衡》作者，批判迷信。' },
  { name: 'Zheng Xuan', chinese_name: '郑玄', his_id: 'donghan_617402', birth_date: '127年', death_date: '200年', nationality: '中国_东汉', occupation: '经学家', biography: '东汉经学大师，遍注群经，经学集大成者。' },
  { name: 'Xu Shen', chinese_name: '许慎', his_id: 'donghan_061121', birth_date: '约58年', death_date: '约147年', nationality: '中国_东汉', occupation: '文字学家', biography: '东汉文字学家，《说文解字》作者。' },
  { name: 'Zhang Heng', chinese_name: '张衡', his_id: 'donghan_433306', birth_date: '78年', death_date: '139年', nationality: '中国_东汉', occupation: '科学家', biography: '东汉科学家、文学家，发明地动仪、浑天仪。' },
  { name: 'Cai Lun', chinese_name: '蔡伦', his_id: 'donghan_760505', birth_date: '约63年', death_date: '121年', nationality: '中国_东汉', occupation: '发明家', biography: '东汉发明家，改进造纸术，蔡侯纸。' },
  { name: 'Hua Tuo', chinese_name: '华佗', his_id: 'donghan_319957', birth_date: '约145年', death_date: '约208年', nationality: '中国_东汉', occupation: '神医', biography: '东汉名医，发明麻沸散，开创外科手术。' },
  { name: 'He Jin', chinese_name: '何进', his_id: 'donghan_094755', birth_date: '约135年', death_date: '189年', nationality: '中国_东汉', occupation: '大将军', biography: '东汉外戚、大将军，招董卓入京导致天下大乱。' },
  { name: 'Lu Zhi', chinese_name: '卢植', his_id: 'donghan_440700', birth_date: '约139年', death_date: '192年', nationality: '中国_东汉', occupation: '名将、经学家', biography: '东汉名将、学者，刘备老师，黄巾之战有功。' },
  { name: 'Zhang Jiao', chinese_name: '张角', his_id: 'donghan_450474', birth_date: '约140年', death_date: '184年', nationality: '中国_东汉', occupation: '太平道首领', biography: '东汉黄巾起义领袖，创立太平道，"苍天已死，黄天当立"。' },
  { name: 'Huangfu Song', chinese_name: '皇甫嵩', his_id: 'donghan_533823', birth_date: '约140年', death_date: '195年', nationality: '中国_东汉', occupation: '左将军', biography: '东汉名将，平定黄巾之乱的主要统帅。' },
];

export async function seed() {
  await initSchema();
  const db = getDb();

  // 安全检查：如果已有数据则跳过，绝不删除
  const row = db.exec("SELECT COUNT(*) as cnt FROM celebrities");
  if (row[0].values[0][0] > 0) {
    console.log('✅ 数据库中已有名人数据，跳过 seed');
    return;
  }

  const insert = db.prepare(
    `INSERT INTO celebrities (name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const c of celebrities) {
    insert.bind([c.name, c.chinese_name, c.his_id, c.birth_date, c.death_date, c.nationality, c.occupation, c.biography]);
    insert.step();
    insert.reset();
  }
  insert.free();

  saveDb();
  console.log(`✅ 已导入 ${celebrities.length} 位名人`);
}

seed().catch(console.error);