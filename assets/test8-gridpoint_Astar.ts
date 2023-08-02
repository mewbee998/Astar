// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
// export class point{
//     pos:cc.Vec2;
//     H:number;
//     F:number;
//     G:number;
//     constructor (pos:cc.Vec2,H?:number,F?:number,G?:number){
//         this.pos = pos;
//         this.H = H;
//         this.F = F;
//         this.G = G;
//     }
// }
export class juli{
    H:number;
    F:number;
    G:number;
    pre:cc.Vec2;
}
@ccclass
export default class NewClass extends cc.Component {

    tiledmap:cc.TiledMap;
    tiledLayer:cc.TiledLayer;//纯色层
    pointjuli:Map<string,juli> = new Map();//设置点的对应的距离数值
    onLoad () {
        this.tiledmap = this.node.getComponent(cc.TiledMap);
        this.tiledLayer = this.tiledmap.getLayer("纯色层");
    }

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START,(touch:cc.Touch)=>{
            
            let localpos = this.node.convertToNodeSpaceAR(touch.getLocation());
            let gridPos = cc.v2(Math.floor(localpos.x/960*30), Math.floor(localpos.y/640*20));
            console.log(localpos.x+"||"+localpos.y+"&&"+gridPos.toString());

            let tile = this.tiledmap.getLayer("纯色层").getTiledTileAt(gridPos.x,19-gridPos.y,true);//y轴是反转的
            let tile2 = this.tiledmap.getLayer("纯色层").getTiledTileAt(gridPos.x,19-gridPos.y,false);
            tile.node.color = cc.Color.ORANGE;
            console.log(tile2);
        },this);
        this.Astar(cc.v2(10,9),cc.v2(2,3));
    }

    //update (dt) {}
    async Astar(startpoint:cc.Vec2,end:cc.Vec2){
        let unuse:cc.Vec2[] = this.setUnuse(startpoint);//设置未使用的点坐标们
        let used:cc.Vec2[]=[cc.v2(10,4),cc.v2(9,4),cc.v2(9,5),cc.v2(9,6),cc.v2(11,4),cc.v2(11,5),cc.v2(8,6)];//障碍物数组
        let selected:cc.Vec2[]=[];//已经被计算选择过的节点们
        let path:cc.Vec2[]=[startpoint];//正向寻找到的路径数组
        let finalPath:cc.Vec2[]=[];//最终的（逆向寻找到）路径数组
        let currentpoint:cc.Vec2;//当前节点

        this.pointjuli.set(startpoint.toString(),{H:0,F:999,G:999,pre:startpoint});//起点的属性初始化赋值
        let startnode = this.tiledLayer.getTiledTileAt(startpoint.x,19-startpoint.y,true).node;//其它初始化设置
        let endnode = this.tiledLayer.getTiledTileAt(end.x,19-end.y,true).node;
        used.forEach(value=>this.tiledLayer.getTiledTileAt(value.x,19-value.y,true).node.color = cc.Color.RED);
        startnode.color = cc.Color.ORANGE;
        endnode.color = cc.Color.BLUE;
        currentpoint = startpoint;


        while(currentpoint.x!=end.x||currentpoint.y!=end.y){//正向打通
            await new Promise(resolve => setTimeout(resolve, 1000));
            //this.pointjuli.set(startpoint,{H:0,F:999,G:999,pre:null});//起点的字典值
            let neighbours:cc.Vec2[] = this.getUSENeighbour(currentpoint,used,path);//获得 当前节点 非地图外、障碍物、已使用路径的 可用的 邻居（x/4）
            if(neighbours.length<1){
                //当前节点无可用邻居，撞到死胡同了，返回使用上一个节点
                currentpoint = this.pointjuli.get(currentpoint.toString()).pre;
                continue;
            }
            console.log(currentpoint+"得到的可用邻居们"+neighbours.toString());
            let minPos = this.getMin(neighbours,end);//得到剩余中代价最小的邻居

            neighbours = this.filterToXXX(neighbours,minPos,path);//将最小值（未来的路径节点）存入path数组
            neighbours.forEach(value => unuse = this.filterToXXX(unuse,value,selected));//将本次找到的除minPos节点全部存入已选择过的节点

            neighbours.forEach((value)=>{//更新选择过的节点及最小值（路径）节点的颜色
                this.tiledLayer.getTiledTileAt(value.x,19-value.y,true).node.color = startnode.color;
            });
            this.tiledLayer.getTiledTileAt(minPos.x,19-minPos.y,true).node.color = endnode.color;
            
            console.log("最小值节点为"+minPos);
            currentpoint = minPos;
        };//与最终节点不相同即可，所以是||而不是&&
        
        while(currentpoint.x!=startpoint.x||currentpoint.y!=startpoint.y){//逆向寻路
            await new Promise(resolve => setTimeout(resolve, 1000));
            let pathNeighbours = this.getPATHNeighbour(currentpoint,path);
            if(pathNeighbours == null){
                console.log("已找完");
            }else{
                let minPath = this.getMin(pathNeighbours,startpoint);
                finalPath.push(minPath);
                this.tiledLayer.getTiledTileAt(minPath.x,19-minPath.y,true).node.color = cc.Color.YELLOW;
                console.log("找到路径"+minPath.toString());
                currentpoint = minPath;
            }
        }

        

        //finalPath.forEach(value=>this.tiledLayer.getTiledTileAt(value.x,19-value.y,true).node.color = cc.Color.YELLOW);
        startnode.color = cc.Color.RED;//结束后标识首尾节点
        endnode.color = cc.Color.RED;
    }

    setUnuse(startpoint:cc.Vec2){
        let newmap:cc.Vec2[]=[];
        let s = this.tiledmap.getMapSize();
        for(let i=0;i<s.width;i++){
            for(let k=0;k<s.height;k++){
                newmap.push(cc.v2(i,k));
                this.pointjuli.set(cc.v2(i,k).toString(),new juli());//{H:null,F:null,G:null,pre:null});//初始化字典。值全部为空
            }
        }
        newmap.splice(newmap.indexOf(startpoint),1);//删掉起始点
        //newmap.forEach((value)=>{this.pointjuli.set(value,{H:null,F:null,G:null,pre:null})});//初始化字典，数值全部为null
        console.log("设置数组及字典完毕");
        // this.pointjuli.forEach((value,key)=>{
        //     console.log(key+"||"+value);
        // })
        return newmap;
    }
    getUSENeighbour(pos:cc.Vec2,useds:cc.Vec2[],paths:cc.Vec2[]){//获得可用的邻居节点，正向寻找时使用
        let neighbours:cc.Vec2[]=[];
        let canUSE:cc.Vec2[]=[];
        let W = cc.v2(pos.x,pos.y+1);
        let S = cc.v2(pos.x,pos.y-1);
        let A = cc.v2(pos.x-1,pos.y);
        let D = cc.v2(pos.x+1,pos.y);
        neighbours.push(W,S,A,D);
        //console.log("邻居数组"+neighbours.length);
        neighbours.forEach((value)=>{
            if(this.pointjuli.has(value.toString())&&!this.have(useds,value)&&!this.have(paths,value)){
                this.pointjuli.get(value.toString()).pre = pos
                canUSE.push(value);
                //console.log(value+"拿到的邻居距离值"+this.pointjuli.get(value.toString()).pre);
            }
        });//设置对应点的字典值中上一节点
        //let canUSE = neighbours.filter((value)=>{return this.pointjuli.has(value.toString())});
        return canUSE;
    }
    /**
     * 
     * @param pos 当前节点
     * @param paths 路径数组
     * @param startpoint 开始节点，判断结束用
     * @returns 返回null代表结束
     */
    getPATHNeighbour(pos:cc.Vec2,paths:cc.Vec2[]){//获得路径邻居，逆向打印路径时使用
        let neighbours:cc.Vec2[]=[];
        let pathUSE:cc.Vec2[]=[];
        let W = cc.v2(pos.x,pos.y+1);
        let S = cc.v2(pos.x,pos.y-1);
        let A = cc.v2(pos.x-1,pos.y);
        let D = cc.v2(pos.x+1,pos.y);
        neighbours.push(W,S,A,D);
        neighbours.forEach((value)=>{
            if(this.have(paths,value)){
                pathUSE.push(value);
            }
        });
        return pathUSE;
    }
    getMin(poss:cc.Vec2[],end:cc.Vec2){
        let min:number=999;
        let minPos:cc.Vec2;
        for(let pos of poss){//设置对应点的字典值中距离数值
            this.pointjuli.get(pos.toString()).H = this.pointjuli.get(this.pointjuli.get(pos.toString()).pre.toString()).H+1;//实际距离是上一个点的H加1
            this.pointjuli.get(pos.toString()).F = Math.abs(pos.x - end.x) + Math.abs(pos.y - end.y);
            this.pointjuli.get(pos.toString()).G = this.pointjuli.get(pos.toString()).F + this.pointjuli.get(pos.toString()).H;
            console.log(pos+"上一个节点"+this.pointjuli.get(pos.toString()).pre+"和它的代价"+this.pointjuli.get(pos.toString()).G);
            if(this.pointjuli.get(pos.toString()).G < min){//选取最小的值
                console.log("找到最小值"+this.pointjuli.get(pos.toString()).G);
                min = this.pointjuli.get(pos.toString()).G;
                minPos = pos;
            }
            // if((pos.x==startpoint.x&&pos.y==startpoint.y)||(pos.x==end.x&&pos.y==end.y)){//如果找到了起点或者终点，直接无脑选择
            //     min = -1;//直接设置成-1，锁死最小值
            //     minPos = pos;
            //     break;
            // }
        }
        return minPos;
    }

    /**
     * @param v2s 需要过滤的原数组
     * @param v2 需要被过滤（删除）的元素
     * @param v2d 过滤后存入的数组
     * @returns 返回过滤后的数组
     * @description 传入未使用的节点数组，过滤掉被使用的邻居节点，将其存入已使用数组，并得到过滤后的数组
     */
    filterToXXX(v2s:cc.Vec2[],v2:cc.Vec2,v2d:cc.Vec2[]){
        let newv2s = v2s.filter((value)=>{if(value.x==v2.x&&value.y==v2.y){v2d.push(value)}else return value});
        return newv2s;
    }

    have(v2s:cc.Vec2[],v2:cc.Vec2){
        let newv2s = v2s.filter((value)=>{return value.x==v2.x&&value.y==v2.y});
        if(newv2s.length>0){
            return true;
        }else{
            return false;
        }
    }
}

