/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference lib="dom" />

/** Merge properties, avoids property if the same name. `U`s type members will overwrite any conflicting type members in `T`. */
export type Overlay<T, U> = Omit<U, keyof T> & T

/** Returns the last element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel3 */
type LastElement<Arr extends [...any]> = Arr extends [...infer U, infer T] ? T : never

/** Returns the first element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel1 */
type FirstElement<Arr extends [...any]> = Arr[0]

/** Flatten an S-expression. Example [A, [B, [C, []]]] -> [A, B, C] */
type FlattenExpr<T> =
	T extends [infer U, infer V] ? [U, ...FlattenExpr<V>] :
	T extends [infer U] ? T :
	[]

/** Used to signal type argument error */
type BindingContextRequired = 'Argument must be a Binding Context'

/** Create an S-Expression from a BindinContext-hierarchy.
 * Example: ChildBindingContext<A, ChildBindingContext<B, RootBindingContext<C>>> -> [A, [B, [C, []]]] */
type CreateSExpr<BC> =
	BC extends ChildBindingContext<infer V, infer U> ? [V, CreateSExpr<U>] :
	BC extends RootBindingContext<infer V> ? [V] :
	BindingContextRequired;

type ViewModelArray<BC> = FlattenExpr<CreateSExpr<BC>>

export interface RootBindingContext<ViewModel> {
	$parents: []
	$root: ViewModel
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

export interface ChildBindingContext<ViewModel, ParentContext> {
	$parents: ViewModelArray<ParentContext>
	$parent: FirstElement<ViewModelArray<ParentContext>>
	$root: LastElement<[ViewModel, ...ViewModelArray<ParentContext>]>
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

export type BindingContext = RootBindingContext<unknown> | ChildBindingContext<unknown, unknown>

export interface ReadonlyObservable<T> { (): T }
export interface Observable<T> extends ReadonlyObservable<T> { (value: T): void }
type ReadonlyObservableArray<T> = ReadonlyObservable<T[]>
type ObservableArray<T> = Observable<T[]>

export interface Computed<T> {
   (): T
   (value: T): this
}
export interface PureComputed<T> extends Computed<T> { }

export interface Subscribable<T> {
	subscribe: (...args: any[]) => any
}

export type MaybeObservable<T> = T | Observable<T>
export type MaybeReadonlyObservable<T> = T | ReadonlyObservable<T>
export type MaybeObservableArray<T> = T[] | ObservableArray<T>
export type MaybeReadonlyObservableArray<T> = readonly T[] | ReadonlyObservableArray<T>
export type MaybeComputed<T> = T | Computed<T> | PureComputed<T>
export type MaybeSubscribable<T> = T | Subscribable<T>

/** Binding handler with value type `T`. */
export type BindingHandlerReturnType<T> = (value: MaybeObservable<T>, pc: BindingContext) => void

/** Standard for for normal binding handlers that does not control descendant bindings */
export type BindingContextIdentityTransform<V> = <Context>(value: V, ctx: Context) => Context

// ----------------------------------------------------------------------------
//                 ADDITIONAL TYPES FOR BUILTIN BINDING HANDLERS
// ----------------------------------------------------------------------------

// Additional Types for event, click, submit bindings.
type WindowEventListenerMap = {
	[key in keyof WindowEventMap]: (event: WindowEventMap[key]) => any
}

export interface StandardBindingContextTransforms {
	visible: BindingContextIdentityTransform<boolean>
	hidden: BindingContextIdentityTransform<boolean>
	html: BindingContextIdentityTransform<string>
	class: BindingContextIdentityTransform<string>
	css: BindingContextIdentityTransform<string | Record<string, boolean>>
	style: BindingContextIdentityTransform<Record<string, string>>
	attr: BindingContextIdentityTransform<Record<string, string>>
	text: BindingContextIdentityTransform<string>
	event: BindingContextIdentityTransform<Record<string, () => void>>
	click: BindingContextIdentityTransform<() => void>
	submit: BindingContextIdentityTransform<() => void>
	enable: BindingContextIdentityTransform<boolean>
	disable: BindingContextIdentityTransform<boolean>
	value: BindingContextIdentityTransform<any>
	textInput: BindingContextIdentityTransform<string>
	hasFocus: BindingContextIdentityTransform<any>
	checked: BindingContextIdentityTransform<any>
	checkedValue: BindingContextIdentityTransform<any>
	options: BindingContextIdentityTransform<any>
	selectedOptions: BindingContextIdentityTransform<any>
	uniqueName: BindingContextIdentityTransform<boolean>
	template: BindingContextIdentityTransform<any>
	component: BindingContextIdentityTransform<string | { name: any; params: any; }>
	if: BindingContextIdentityTransform<boolean>
	ifnot: BindingContextIdentityTransform<boolean>

	foreach: <V, Context extends BindingContext>(value: MaybeReadonlyObservableArray<V>, parentContext: Context) =>
		V extends { data: MaybeObservableArray<infer T>; as: string } ? unknown : // TODO: Try to figure out the value of 'as' when it is statically decided. Make sure to properly dissuade the user to use the 'as'-form when we have no chance of deducing the resulting type during compile-time.
		Overlay<ChildBindingContext<V, Context>, Context>
	using: StandardBindingContextTransforms['with']
	with: <V extends object, Context extends BindingContext>(value: MaybeReadonlyObservable<V>, parentContext: Context) => Overlay<ChildBindingContext<V, Context>, Context>
	let: <T extends object, Context extends BindingContext>(value: MaybeReadonlyObservable<T>, parentContext: Context) => Overlay<Context, T>
}