import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { roleLabel } from '../lib/roles';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { t, i18n } = useTranslation();
  const [favs, setFavs] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [areq, setAreq] = useState<any>(null);
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [arMsg, setArMsg] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [qans, setQans] = useState<Record<string, number>>({});
  const roleRefreshed = useRef(false);

  useEffect(() => {
    api.get('/users/me/favorites').then(r => setFavs(r.data)).catch(() => {});
    api.get('/author-requests/mine').then(r => setAreq(r.data)).catch(() => {});
    refresh();
  }, []);
  useEffect(() => {
    if (user) setName(user.name);
    // test nou (5 intrebari random) la fiecare incercare noua sau re-examinare
    if (user?.role === 'USER' && (!areq || areq.status === 'REJECTED')) {
      api.get(`/author-requests/quiz?lang=${i18n.language}`).then(r => { setQuiz(r.data); setQans({}); }).catch(() => {});
    }
    // cerere aprobata dar rolul din context e vechi (token emis inainte de promovare) -> reincarca o data
    if (user?.role === 'USER' && areq?.status === 'APPROVED' && !roleRefreshed.current) {
      roleRefreshed.current = true;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, areq?.status]);

  if (!user) return <p>{t('auth.needLogin')} <Link to="/login">{t('auth.login')}</Link>.</p>;

  const sendAuthorRequest = async (e: any) => {
    e.preventDefault(); setArMsg('');
    try {
      const { data } = await api.post('/author-requests', { motivation, experience, quizId: quiz?.id, answers: qans });
      setAreq(data);
      if (data.autoApproved) {
        setArMsg(t('profile.arAutoOk'));
        await refresh();
      } else {
        setArMsg(t('profile.arSent'));
      }
    } catch (err: any) {
      const code = err.response?.data?.error;
      if (code === 'motivation_min_20') setArMsg(t('profile.arMotivationShort', { n: motivation.trim().length }));
      else if (code === 'experience_min_10') setArMsg(t('profile.arExperienceShort', { n: experience.trim().length }));
      else if (code === 'already_pending') setArMsg(t('profile.arPending'));
      else if (code === 'already_privileged') setArMsg(t('profile.arPrivileged'));
      else setArMsg(t('profile.arErr'));
    }
  };

  const saveName = async (e: any) => {
    e.preventDefault(); setMsg('');
    try {
      await api.patch('/auth/me', { name });
      await refresh(); setMsg('✓');
    } catch { setMsg(t('profile.saveErr')); }
  };
  const removeFav = async (recipeId: number) => {
    await api.delete(`/recipes/${recipeId}/favorite`);
    setFavs(favs.filter(r => r.id !== recipeId));
  };
  const savePw = async (e: any) => {
    e.preventDefault(); setPwMsg('');
    if (npw.length < 6) { setPwMsg(t('profile.pwShort')); return; }
    try {
      await api.patch('/auth/me/password', { currentPassword: cur, newPassword: npw });
      setCur(''); setNpw(''); setPwMsg(t('profile.pwOk'));
    } catch (err: any) {
      setPwMsg(err.response?.data?.error === 'wrong_current_password' ? t('profile.pwWrong') : t('profile.pwErr'));
    }
  };

  return (
    <>
      <h1>{t('profile.title')} — {user.name}</h1>
      <p className="meta">{user.email} · {t('profile.role')}: <b>{roleLabel(user.role)}</b> · <Link to="/conversatii">{t('profile.myConvs')}</Link></p>
      {user.role === 'USER' && (
        <section className="panel" style={{ marginBottom: 18 }}>
          <h3>{t('profile.becomeAuthor')}</h3>
          {areq?.status === 'PENDING' && <p className="notice">{t('profile.pendingNotice')}</p>}
          {areq?.status === 'APPROVED' && <p className="notice">{t('profile.approvedNotice')}</p>}
          {(!areq || areq.status === 'REJECTED') && (
            <form onSubmit={sendAuthorRequest} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {areq?.status === 'REJECTED' && <p className="meta">{t('profile.rejectedRetry')}</p>}
              <label>{t('profile.motivation', { n: motivation.trim().length })}
                <textarea rows={3} value={motivation} onChange={e => setMotivation(e.target.value)} placeholder={t('profile.motivationPh')} /></label>
              <label>{t('profile.experience', { n: experience.trim().length })}
                <textarea rows={2} value={experience} onChange={e => setExperience(e.target.value)} placeholder={t('profile.experiencePh')} /></label>
              {!!quiz?.questions?.length && (
                <div className="quiz-block">
                  <h4>{t('profile.quizTitle')}</h4>
                  {quiz.questions.map((qq: any, i: number) => (
                    <div key={qq.qid} className="quiz-q">
                      <p><strong>{i + 1}. {qq.q}</strong></p>
                      <div className="quiz-opts">
                        {qq.options.map((op: string, oi: number) => (
                          <label key={oi} className={`quiz-opt ${qans[qq.qid] === oi ? 'sel' : ''}`}>
                            <input type="radio" name={`quiz-${qq.qid}`} checked={qans[qq.qid] === oi}
                              onChange={() => setQans({ ...qans, [qq.qid]: oi })} />
                            <span>{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div><button className="btn small">{t('profile.submitRequest')}</button></div>
              {arMsg && <p className="meta">{arMsg}</p>}
            </form>
          )}
        </section>
      )}
      <div className="dash-cols">
        <section className="panel">
          <h3>{t('profile.myData')}</h3>
          <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>{t('profile.name')}<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>{t('profile.emailLocked')}<input value={user.email} disabled style={{ opacity: 0.6 }} /></label>
            <div><button className="btn small">{t('profile.save')} {msg}</button></div>
          </form>
        </section>
        <section className="panel">
          <h3>{t('profile.changePw')}</h3>
          <form onSubmit={savePw} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>{t('profile.curPw')}<input type="password" value={cur} onChange={e => setCur(e.target.value)} /></label>
            <label>{t('profile.newPw')}<input type="password" value={npw} onChange={e => setNpw(e.target.value)} /></label>
            <div><button className="btn small">{t('profile.changePw')}</button></div>
            {pwMsg && <p className="meta">{pwMsg}</p>}
          </form>
        </section>
      </div>
      <h2>{t('profile.favorites')}</h2>
      <div className="grid">{favs.map((r: any) => (
        <div className="card" key={r.id}>
          {r.imageUrl ? <img src={imgUrl(r.imageUrl)} alt="" loading="lazy" /> : <div className="card-ph">🥣</div>}
          <div className="body">
            <strong>{localized(r, 'title', i18n.language)}</strong>
            <span className="meta">⭐ {Number(r.avgRating || 0).toFixed(1)} · 👁 {r.viewsCount || 0}</span>
            <div className="row">
              <Link className="btn secondary small" to={recipeUrl(r)}>{t('profile.view')}</Link>
              <button className="btn danger small" onClick={() => removeFav(r.id)}>{t('profile.unfav')}</button>
            </div>
          </div>
        </div>
      ))}</div>
    </>
  );
}
