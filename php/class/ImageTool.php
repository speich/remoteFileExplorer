<?php
/**
 * Most functions are taken from phpThumb 
 * @see http://phpthumb.sourceforge.net/index.php?source=phpthumb.filters.php
 *
 * Unsharp Mask for PHP - version 2.1.1
 * Unsharp mask algorithm by Torstein Hønsi 2003-07.
 * thoensi_at_netcom_dot_no.
 */
namespace remoteFileExplorer\image;

 
class ImageTool {

	/**
	 * Creates a thumbnail from provided image and stores it at the target location.
	 * @param string $imgSrc full path to image
	 * @param string $imgTarget full path where to store
	 * @param integer $newWidth width
	 * @param integer $quality jpg compression
	 * @param array $filters filters to apply
	 */
	public function createThumb($imgSrc, $imgTarget, $newWidth, $quality, $filters = null) {
		$img = imagecreatefromjpeg($imgSrc);
		// calculate thumbnail height from width
		$width = imagesx($img);
		$height = imagesy($img);
		$newHeight = floor($height * $newWidth / $width);
		// create new image and save it
		$tmpImg = imagecreatetruecolor($newWidth, $newHeight);
		imagecopyresampled($tmpImg, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
		if (!is_null($filters)) {
			if (array_key_exists('unsharpMask', $filters)) {
				$this->unsharpMask($tmpImg, count($filters['unsharpMask']) > 0 ? $filters['unsharpMask'] : null);
			}
			if (array_key_exists('stretchHistogram', $filters)) {
				$this->stretchHistogram($tmpImg, count($filters['stretchHistogram']) ? $filters['stretchHistogram'] : null);
			}
		}
		imageinterlace($tmpImg, true);
		imagejpeg($tmpImg, $imgTarget, $quality);
		imagedestroy($tmpImg);
		imagedestroy($img);
	}

	/**
	 * Sharpens image with filter unsharp mask.
	 * image hast to be already created with imgcreatetruecolor.
	 * $filterValues = array(
	 * 	'amount'	 	=>
	 * 	'radius' 	=>
	 * 	'threshold' =>
	 * )
	 * Unsharp Mask for PHP - version 2.1.1
	 * algorithm by Torstein Hønsi 2003-07
	 * thoensi_at_netcom_dot_no
	 * @param resource $gdImg truecolorImage
	 * @param array $filterValues
	 */
	public function unsharpMask(&$gdImg, $filterValues = null)    {
		$amount = !is_null($filterValues) ? $filterValues['amount'] : 30;
		$radius = !is_null($filterValues) ? $filterValues['radius'] : 0.9;
		$threshold = !is_null($filterValues) ? $filterValues['threshold'] : 0;

		// Attempt to calibrate the parameters to Photoshop:
		if ($amount > 500) {
			$amount = 500;
		}
		$amount = $amount * 0.016;
		if ($radius > 50) {
			$radius = 50;
		}
		$radius = $radius * 2;
		if ($threshold > 255) {
			$threshold = 255;
		}
		$radius = abs(round($radius)); // Only integers make sense.
		if ($radius == 0) {
			return;
		}
		$w = imagesx($gdImg);
		$h = imagesy($gdImg);
		$imgBlur = imagecreatetruecolor($w, $h);

		/* Gaussian blur matrix:
				1  2  1
				2  4  2
				1  2  1
		*/
		$matrix = array(array(1, 2, 1), array(2, 4, 2), array(1, 2, 1));
		imagecopy($imgBlur, $gdImg, 0, 0, 0, 0, $w, $h);
		imageconvolution($imgBlur, $matrix, 16, 0);
		if ($threshold > 0) {
			// Calculate the difference between the blurred pixels and the original
			// and set the pixels
			for ($x = 0; $x < $w - 1; $x++) { // each row
				for ($y = 0; $y < $h; $y++) { // each pixel
					$rgbOrig = imagecolorat($gdImg, $x, $y);
					$rOrig = (($rgbOrig >> 16) & 0xFF);
					$gOrig = (($rgbOrig >> 8) & 0xFF);
					$bOrig = ($rgbOrig & 0xFF);

					$rgbBlur = imagecolorat($imgBlur, $x, $y);
					$rBlur = (($rgbBlur >> 16) & 0xFF);
					$gBlur = (($rgbBlur >> 8) & 0xFF);
					$bBlur = ($rgbBlur & 0xFF);

					// When the masked pixels differ less from the original
					// than the threshold specifies, they are set to their original value.
					$rNew = (abs($rOrig - $rBlur) >= $threshold) ? max(0, min(255, ($amount * ($rOrig - $rBlur)) + $rOrig)) : $rOrig;
					$gNew = (abs($gOrig - $gBlur) >= $threshold) ? max(0, min(255, ($amount * ($gOrig - $gBlur)) + $gOrig)) : $gOrig;
					$bNew = (abs($bOrig - $bBlur) >= $threshold) ? max(0, min(255, ($amount * ($bOrig - $bBlur)) + $bOrig)) : $bOrig;

					if (($rOrig != $rNew) || ($gOrig != $gNew) || ($bOrig != $bNew)) {
						$pixCol = imagecolorallocate($gdImg, $rNew, $gNew, $bNew);
						imagesetpixel($gdImg, $x, $y, $pixCol);
					}
				}
			}
		}
		else {
			for ($x = 0; $x < $w; $x++) { // each row
				for ($y = 0; $y < $h; $y++) { // each pixel
					$rgbOrig = imagecolorat($gdImg, $x, $y);
					$rOrig = (($rgbOrig >> 16) & 0xFF);
					$gOrig = (($rgbOrig >> 8) & 0xFF);
					$bOrig = ($rgbOrig & 0xFF);

					$rgbBlur = imagecolorat($imgBlur, $x, $y);
					$rBlur = (($rgbBlur >> 16) & 0xFF);
					$gBlur = (($rgbBlur >> 8) & 0xFF);
					$bBlur = ($rgbBlur & 0xFF);

					$rNew = ($amount * ($rOrig - $rBlur)) + $rOrig;
					if ($rNew > 255) {
						$rNew = 255;
					}
					elseif ($rNew < 0) {
						$rNew = 0;
					}
					$gNew = ($amount * ($gOrig - $gBlur)) + $gOrig;
					if ($gNew > 255) {
						$gNew = 255;
					}
					elseif ($gNew < 0) {
						$gNew = 0;
					}
					$bNew = ($amount * ($bOrig - $bBlur)) + $bOrig;
					if ($bNew > 255) {
						$bNew = 255;
					}
					elseif ($bNew < 0) {
						$bNew = 0;
					}
					$rgbNew = ($rNew << 16) + ($gNew << 8) + $bNew;
					imagesetpixel($gdImg, $x, $y, $rgbNew);
				}
			}
		}
		imagedestroy($imgBlur);
	}

	//http://phpthumb.sourceforge.net/index.php?source=phpthumb.filters.php
	public function createHistogram(&$gdImg, $calculateGray = false) {
		$imgX = imagesx($gdImg);
		$imgY = imagesy($gdImg);
		$analysis = array(
			'red' => range(0, 255),
			'green' => range(0, 255),
			'blue' => range(0, 255),
			'alpha' => range(0, 255),
		);
		if ($calculateGray) {
			$analysis['gray'] = range(0, 255); 
		}
		for ($x = 0; $x < $imgX; $x++) {
			for ($y = 0; $y < $imgY; $y++) {
				$origPixel = $this->getPixelColor($gdImg, $x, $y);
				$analysis['red'][$origPixel['red']]++;
				$analysis['green'][$origPixel['green']]++;
				$analysis['blue'][$origPixel['blue']]++;
				$analysis['alpha'][$origPixel['alpha']]++;
				if ($calculateGray) {
					$grayPixel = $this->getGrayscalePixel($origPixel);
					$analysis['gray'][$grayPixel['red']]++;
				}
			}
		}
		$keys = array('red', 'green', 'blue', 'alpha');
		if ($calculateGray) {
			$keys[] = 'gray';
		}
		foreach ($keys as $dummy => $key) {
			ksort($analysis[$key]);
		}
		return $analysis;
	}

	/**
	 * Stretches images values to cover whole range from white to black.
	 * Equivalent of "Auto Contrast" in Adobe Photoshop
	 * Method = 0 stretches according to RGB colors. Gives a more conservative stretch. default
	 * Method = 1 band stretches according to grayscale which is color-biased (59% green, 30% red, 11% blue). May give a punchier / more aggressive stretch, possibly appearing over-saturated
	 * @param resource $gdImg truecolorImage
	 * @param array $filterValues
	 * @return bool
	 */
	function stretchHistogram(&$gdImg, $filterValues = null) {
		$band = !is_null($filterValues) ? $filterValues['band'] : '*';
		$method = !is_null($filterValues) ? $filterValues['method'] : 0;
		$threshold = !is_null($filterValues) ? $filterValues['threshold'] : 0.1;
		
		$keys = array('r'=>'red', 'g'=>'green', 'b'=>'blue', 'a'=>'alpha', '*'=>(($method == 0) ? 'all' : 'gray'));
		$band = substr($band, 0, 1);
		if (!isset($keys[$band])) {
			return false;
		}
		$key = $keys[$band];

		// If the absolute brightest and darkest pixels are used then one random
		// pixel in the image could throw off the whole system. Instead, count up/down
		// from the limit and allow <threshold> (default = 0.1%) of brightest/darkest
		// pixels to be clipped to min/max
		$analysis = $this->createHistogram($gdImg, true);
		$threshold = floatval($threshold) / 100;
		$clipping = imagesx($gdImg) * imagesx($gdImg) * $threshold;
		$countSum = 0;
		for ($i = 0; $i <= 255; $i++) {
			if ($method == 0) {
				$countSum = max(@$analysis['red'][$i], @$analysis['green'][$i], @$analysis['blue'][$i]);
			} else {
				$countSum += @$analysis[$key][$i];
			}
			if ($countSum >= $clipping) {
				$rangeMin = $i - 1;
				break;
			}
		}
		$rangeMin = max($rangeMin, 0);
		$countSum = 0;
		for ($i = 255; $i >= 0; $i--) {
			if ($method == 0) {
				$countSum = max(@$analysis['red'][$i], @$analysis['green'][$i], @$analysis['blue'][$i]);
			} else {
				$countSum += @$analysis[$key][$i];
			}
			if ($countSum >= $clipping) {
				$rangeMax = $i + 1;
				break;
			}
		}
		$rangeMax = min($rangeMax, 255);
		$rangeScale = (($rangeMax == $rangeMin) ? 1 : (255 / ($rangeMax - $rangeMin)));
		if (($rangeMin == 0) && ($rangeMax == 255)) {
			// no adjustment necessary - don't waste CPU time!
			return true;
		}

		$imgX = imagesx($gdImg);
		$imgY = imagesy($gdImg);
		for ($x = 0; $x < $imgX; $x++) {
			for ($y = 0; $y < $imgY; $y++) {
				$origPixel = $this->getPixelColor($gdImg, $x, $y);
				if ($band == '*') {
					$new['red']   = min(255, max(0, ($origPixel['red']   - $rangeMin) * $rangeScale));
					$new['green'] = min(255, max(0, ($origPixel['green'] - $rangeMin) * $rangeScale));
					$new['blue']  = min(255, max(0, ($origPixel['blue']  - $rangeMin) * $rangeScale));
					$new['alpha'] = min(255, max(0, ($origPixel['alpha'] - $rangeMin) * $rangeScale));
				} else {
					$new = $origPixel;
					$new[$key] = min(255, max(0, ($origPixel[$key] - $rangeMin) * $rangeScale));
				}
				$newColor = $this->imageColorAllocateAlphaSafe($gdImg, $new['red'], $new['green'], $new['blue'], $new['alpha']);
				imagesetpixel($gdImg, $x, $y, $newColor);
			}
		}
		return true;
	}


	/**
	 * Returns human readable RGB values for a pixel.
	 * @param  $gdImg
	 * @param  $x
	 * @param  $y
	 * @return array
	 */
	public function getPixelColor(&$gdImg, $x, $y) {
		return imagecolorsforindex($gdImg, imagecolorat($gdImg, $x, $y));
	}

	public function imageColorAllocateAlphaSafe(&$gdImgHexcolorAllocate, $R, $G, $B, $alpha = false) {
		if ($alpha) {
			return ImageColorAllocateAlpha($gdImgHexcolorAllocate, $R, $G, $B, intval($alpha));
		} else {
			return ImageColorAllocate($gdImgHexcolorAllocate, $R, $G, $B);
		}
	}

	public function getGrayscaleValue($r, $g, $b) {
		return round(($r * 0.30) + ($g * 0.59) + ($b * 0.11));
	}


	public function getGrayscalePixel($OriginalPixel) {
		$gray = $this->getGrayscaleValue($OriginalPixel['red'], $OriginalPixel['green'], $OriginalPixel['blue']);
		return array('red'=>$gray, 'green'=>$gray, 'blue'=>$gray);
	}
}