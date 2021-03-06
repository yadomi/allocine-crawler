const cheerio = require('cheerio');

function extract_episode_extra_name(data, result)
{
	var match_es = data.match(/(S[0-9]+E[0-9]+) - /g);
	if (match_es && match_es[0])
		result.titles = data.replace(match_es[0], '').trim();
}

function extract_episode_extra_first_play(data, result)
{
	var string_date = '';
	data.forEach((e) =>{
		if (e.data)
			string_date += e.data.replace('\n', '').trim();
	});
	result.first_play = string_date.replace('Diffusé surle ', '');
	var test_first_play_result = result.first_play.split('/');
	if (test_first_play_result.length != 3)
		result.first_play = '';
}

function extract_episode_extra_episode_synopsis(data, result)
{
	if (data && data.type == 'text')
		result.synopsis = data.data;
	else if (data && data.type == 'tag' && data.name == 'span' && data.children && data.children[0])
	{
		if (data.children[0].type == 'text' && data.children[0].data)
			result.synopsis = data.children[0].data;
	}
}

function extract_episode_extra_episode_infos(data, result)
{
	var data_line = '';
	data.forEach((e) => {
		if (e.children && e.children[0] && e.children[0].data && e.children[0].data.trim() != '> plus')
			data_line += e.children[0].data + ', ';
	});
	data_line = data_line.replace(/\n/g, '').replace(/  +/g, ' ');
	var line_info = data_line.split(' :, ');
	if (line_info && (line_info[0] === 'Scénaristes' || line_info[0] === 'Scénariste'))
		result.writers = line_info[1].trim().substr(0, line_info[1].trim().length - 1);
	if (line_info && (line_info[0] === 'Réalisateurs' || line_info[0] === 'Réalisateur'))
		result.director = line_info[1].trim().substr(0, line_info[1].trim().length - 1);
	if (line_info && line_info[0] === 'Casting')
		result.casting = line_info[1].trim().substr(0, line_info[1].trim().length - 1);
}

exports.get = function (query, buffer, callback) {
	var dom = cheerio.load(buffer.toString('utf8'));
	var result = {
		titles: '',
		synopsis: '',
		date: null,
		first_play: '',
		director: '',
		writers: '',
		casting: '',
	};
	//Episode name
	dom('section[class="section section-title-arrow episode-title"]').find('div > div').each(function() {
		if (this.children && this.children[0] && this.children[0].data)
			extract_episode_extra_name(this.children[0].data, result);
	});
	dom('div[class="titlebar-article light"]').each(function() {
		if (this.children && typeof this.children == 'object')
			extract_episode_extra_first_play(this.children, result);
	});
	dom('div[class="episode-synopsis"]').find('div').each(function() {
		if (this.children && this.children[0])
			extract_episode_extra_episode_synopsis(this.children[0], result);
	});
	dom('div[class="episode-infos"]').find('div').each(function() {
		if (this.children && typeof this.children == 'object')
			extract_episode_extra_episode_infos(this.children, result);
	});
	callback.callback({
		name: null,
		titles: result.titles.replace(/\n/g, ''),
		synopsis: result.synopsis.replace(/<\/br> /g, '').replace(/\n/g, ''),
		first_play: result.first_play,
		director: result.director.replace(/\n/g, '').trim(),
		writers: result.writers.replace(/\n/g, '').trim(),
		casting: result.casting.replace(/\n/g, ''),
		season: callback.search_req.season,
		episode: callback.search_req.episode
	}, callback.search_req);
}