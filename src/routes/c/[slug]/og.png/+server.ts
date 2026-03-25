import type { RequestHandler } from './$types';
import { getCreneau } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getDatesInRange, getHours, formatDate, formatHour, heatmapColor } from '$lib/utils';

// Cache fonts at module level
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function getFonts() {
	if (!fontRegular) {
		fontRegular = await fetch(
			'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff'
		).then((r) => r.arrayBuffer());
	}
	if (!fontBold) {
		fontBold = await fetch(
			'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff'
		).then((r) => r.arrayBuffer());
	}
	return { fontRegular: fontRegular!, fontBold: fontBold! };
}

function getBestSlot(creneau: ReturnType<typeof getCreneau>) {
	if (!creneau) return null;
	const dates = getDatesInRange(creneau.date_start, creneau.date_end, creneau.include_weekends);
	const hours = getHours(creneau.hour_start, creneau.hour_end);
	const entries = Object.values(creneau.responses);
	const total = entries.length;
	if (total === 0) return null;

	let best: { date: string; hour: number; count: number; ratio: number } | null = null;
	for (const date of dates) {
		for (const hour of hours) {
			const count = entries.filter((r) => r.slots[date]?.includes(hour)).length;
			const ratio = count / total;
			if (!best || ratio > best.ratio || (ratio === best.ratio && count > best.count)) {
				best = { date, hour, count, ratio };
			}
		}
	}
	return best;
}

export const GET: RequestHandler = async ({ params }) => {
	const creneau = getCreneau(params.slug);
	if (!creneau) error(404, 'Not found');

	const best = getBestSlot(creneau);
	const participantCount = Object.keys(creneau.responses).length;
	const { fontRegular, fontBold } = await getFonts();

	const bestColor = best ? heatmapColor(best.ratio) : '#f9fafb';
	const bestLabel = best
		? `${formatDate(best.date)} · ${formatHour(best.hour)}–${formatHour(best.hour + 1)}`
		: null;
	const bestScore = best ? `${best.count}/${Object.keys(creneau.responses).length} dispo` : null;

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: '#09090b',
					padding: '56px 64px',
					fontFamily: 'Inter',
					position: 'relative'
				},
				children: [
					// Top: brand
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								gap: '10px',
								marginBottom: '48px'
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											width: '10px',
											height: '10px',
											borderRadius: '50%',
											backgroundColor: '#22c55e'
										},
										children: ''
									}
								},
								{
									type: 'div',
									props: {
										style: {
											color: '#71717a',
											fontSize: '18px',
											fontWeight: 400,
											letterSpacing: '0.05em'
										},
										children: 'Créneaux'
									}
								}
							]
						}
					},

					// Title
					{
						type: 'div',
						props: {
							style: {
								color: '#fafafa',
								fontSize: '64px',
								fontWeight: 700,
								lineHeight: 1.1,
								maxWidth: '900px',
								marginBottom: '20px'
							},
							children: creneau.title
						}
					},

					// Date range
					{
						type: 'div',
						props: {
							style: {
								color: '#52525b',
								fontSize: '24px',
								fontWeight: 400,
								marginBottom: '48px'
							},
							children: `${formatDate(creneau.date_start)} → ${formatDate(creneau.date_end)} · ${creneau.hour_start}h–${creneau.hour_end}h`
						}
					},

					// Bottom row: best slot + participants
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'flex-end',
								gap: '24px',
								marginTop: 'auto'
							},
							children: [
								// Best slot card
								...(bestLabel
									? [
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														flexDirection: 'column',
														gap: '8px',
														backgroundColor: '#18181b',
														borderRadius: '16px',
														padding: '24px 32px',
														borderLeft: `6px solid ${bestColor}`,
														flex: '1'
													},
													children: [
														{
															type: 'div',
															props: {
																style: {
																	color: '#71717a',
																	fontSize: '14px',
																	fontWeight: 400,
																	textTransform: 'uppercase',
																	letterSpacing: '0.1em'
																},
																children: 'Meilleur créneau'
															}
														},
														{
															type: 'div',
															props: {
																style: {
																	display: 'flex',
																	alignItems: 'center',
																	gap: '16px'
																},
																children: [
																	{
																		type: 'div',
																		props: {
																			style: {
																				color: '#fafafa',
																				fontSize: '30px',
																				fontWeight: 700
																			},
																			children: bestLabel
																		}
																	},
																	{
																		type: 'div',
																		props: {
																			style: {
																				backgroundColor: bestColor,
																				color: best!.ratio > 0.5 ? '#fff' : '#27272a',
																				fontSize: '16px',
																				fontWeight: 700,
																				padding: '4px 12px',
																				borderRadius: '999px'
																			},
																			children: bestScore ?? ''
																		}
																	}
																]
															}
														}
													]
												}
											}
										]
									: [
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														alignItems: 'center',
														backgroundColor: '#18181b',
														borderRadius: '16px',
														padding: '24px 32px',
														flex: '1'
													},
													children: {
														type: 'div',
														props: {
															style: { color: '#52525b', fontSize: '24px' },
															children: "Aucune réponse pour l'instant"
														}
													}
												}
											}
										]),

								// Participants badge
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											backgroundColor: '#18181b',
											borderRadius: '16px',
											padding: '24px 32px',
											minWidth: '140px',
											gap: '4px'
										},
										children: [
											{
												type: 'div',
												props: {
													style: { color: '#fafafa', fontSize: '36px', fontWeight: 700 },
													children: String(participantCount)
												}
											},
											{
												type: 'div',
												props: {
													style: { color: '#52525b', fontSize: '15px' },
													children: participantCount !== 1 ? 'participants' : 'participant'
												}
											}
										]
									}
								}
							]
						}
					}
				]
			}
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{ name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
				{ name: 'Inter', data: fontBold, weight: 700, style: 'normal' }
			]
		}
	);

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
	const png = resvg.render().asPng();

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};
