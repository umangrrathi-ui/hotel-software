// Consistent backup of the live database + uploaded photos, safe to run while the app serves traffic:
//   docker compose exec -T app node deploy/backup.mjs
// Writes /backups/hotel-YYYY-MM-DD-HHMM.tar.gz (./backups on the server) and keeps the newest 14.
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,statSync,mkdirSync,cpSync,rmSync,mkdtempSync} from 'node:fs';
import {join,relative,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const state=process.env.STATE_DIR||'/data/state',out=process.env.BACKUP_DIR||'/backups',keep=14;
const tmp=mkdtempSync('/tmp/hotel-backup-'),stage=join(tmp,'state');
const walk=d=>readdirSync(d).flatMap(n=>{const p=join(d,n);return statSync(p).isDirectory()?walk(p):[p]});
for(const file of walk(state)){
  const target=join(stage,relative(state,file));mkdirSync(dirname(target),{recursive:true});
  if(file.endsWith('.sqlite')){const db=new DatabaseSync(file);db.exec(`VACUUM INTO '${target.replaceAll("'","''")}'`);db.close();}
  else if(!/\.sqlite-(wal|shm)$/.test(file))cpSync(file,target);
}
mkdirSync(out,{recursive:true});
const name=`hotel-${new Date().toISOString().slice(0,16).replace(/[T:]/g,'-')}.tar.gz`;
execFileSync('tar',['-czf',join(out,name),'-C',tmp,'state']);rmSync(tmp,{recursive:true,force:true});
const old=readdirSync(out).filter(n=>/^hotel-.*\.tar\.gz$/.test(n)).sort().slice(0,-keep);
for(const n of old)rmSync(join(out,n));
console.log('Backup written: '+join(out,name));
