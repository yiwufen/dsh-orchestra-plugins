import { Context } from '@deepseek-ai/cordis';

declare const name = "@dsh-orchestra/delegate";
declare const inject: string[];
/** 注册载荷 = dsh-skill SkillRegistration 的必填子集（provider 由 registry 盖章） */
interface DelegateSkill {
    name: string;
    description: string;
    content: string;
    /** origin 桶（prompt 可见元数据）：skill 正文随插件包分发 = bundled。
     *  dsh-skill 0.2.2-rc.1 的 register 不校验 source，但 get() 加载校验 string——缺省注册得出不可加载的 skill */
    source: 'bundled';
    invocation: {
        modelInvocable: boolean;
        userInvocable: boolean;
    };
    resourceBase: {
        kind: 'directory';
        path: string;
    };
}
/** 宿主接触面收窄：apply 只用这两个成员（测试以 duck-typing mock 驱动，零 cordis 运行时） */
interface MinimalCtx {
    skills?: {
        register(skill: DelegateSkill): () => void;
    };
    effect?(cleanup: () => void): unknown;
}
declare function apply(ctx: Context | MinimalCtx): void;

export { apply, inject, name };
